import express from "express";
import { MongoClient, ObjectId } from "mongodb";

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uri = "mongodb+srv://s122313:BA3c22nnZNeosgrE@clusterpatlag.62wrpgs.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

app.set("view engine", "ejs");
app.set("port", 3000);

interface Player {
    _id?: ObjectId,
    name: string,
    id: number,
    team: TeamMemberPokemon[],
}

interface NonDetailedPokemon {
    name: string,
    url: string,
}

interface DetailedPokemon {
    _id?: ObjectId,
    id: number,
    name: string,
    types: string[], // verduidelijken dat dit meer gedetailleerd is in 'dex
    image: string,
    height: number,
    weight: number,
    maxHP: number, // verduidelijken dat dit onder stats staat
}

interface TeamMemberPokemon extends DetailedPokemon {
    currentHP: number,
}

// let op: deze moet ingevuld worden bij opstart van de applicatie
let players: Player[] = [];
let allPokemon: DetailedPokemon[] = [];

app.get("/", async (req, res) => {
    res.render("index", { players });
});

app.post("/createPlayer", async (req, res) => {
    const newPlayerId = players.reduce((acc, player) => {
        if (player.id >= acc) {
            return player.id + 1;
        }
        else {
            return acc;
        }
    }, 1);
    const newPlayer: Player = { name: req.body.name, id: newPlayerId, team: [] };
    players.push(newPlayer);
    client.db("pokemon").collection("players").insertOne(newPlayer);
    res.redirect("/");
});

app.get("/player/:id", async (req, res) => {
    const playerId = parseInt(req.params.id);
    const player = players.find(({ id }) => playerId === id);
    if (player) {
        res.render("player", { player });
    }
    else {
        res.sendStatus(404);
    }
});




app.get("/player/:id/pokemon", async (req, res) => {
    const player = players.find((player) => player.id === parseInt(req.params.id));
    if (player) {
        res.render("pokemon", { pokemon: allPokemon, player });
    }
    else {
        res.sendStatus(404);
    }    
});




app.post("/player/:id/save", async (req, res) => {
    const player = players.find((player) => player.id === parseInt(req.params.id));
    
    //
    if (player) {
        const playerUpdate = Object.fromEntries(Object.entries(player).filter((pair)=>pair[0] !== "id" && pair[0] !== "_id"));
        client.db("pokemon").collection("players").updateOne({id: player.id}, {$set:playerUpdate});
        console.debug(player.team);
        res.redirect("/player/" + req.params.id);
    }
    else {
        res.sendStatus(404);
    }   
   
});

app.post("/player/:id/pokemon/add/:pokeId", async (req, res) => {
    const player = players.find((player) => player.id === parseInt(req.params.id));
    const singlePokemon = allPokemon.find((singlePokemon) => singlePokemon.id === parseInt(req.params.pokeId));
    if (player && singlePokemon) {
        const randomHP = Math.floor(Math.random() * singlePokemon.maxHP + 1);
        player.team.push({...singlePokemon, currentHP: randomHP});
        if (player.team.length === 7) {
            player.team.shift();
        }
        console.debug(player.team);
        res.redirect("/player/" + req.params.id + "/pokemon");
    }
    else {
        res.sendStatus(404);
    }
});

app.post("/player/:id/pokemon/delete/:pokeId", async (req, res) => {
    res.redirect("/player/" + req.params.id + "/pokemon");

});


app.listen(app.get("port"), async () => {
    await client.connect();
    players = await client
        .db("pokemon")
        .collection("players")
        .find<Player>({})
        .toArray();
    allPokemon = await client
        .db("pokemon")
        .collection("pokemon")
        .find<DetailedPokemon>({})
        .toArray();
    if (allPokemon.length === 0) {
        const nonDetailedPokemon: NonDetailedPokemon[] = (await
            (await fetch("https://pokeapi.co/api/v2/pokemon?limit=151"))
                .json()).results;
        const urls = nonDetailedPokemon.map(({ url }) => url);
        const individualResponsePromises: Promise<Response>[] = urls.map((url) => fetch(url));
        const individualResponses: Response[] = await Promise.all(individualResponsePromises);
        const objectPromises = individualResponses.map((response) => response.json());
        const objects = await Promise.all(objectPromises);
        allPokemon = objects.map((pokemonAsAny) => {
            return {
                id: pokemonAsAny.id,
                name: pokemonAsAny.name,
                height: pokemonAsAny.height,
                weight: pokemonAsAny.weight,
                image: pokemonAsAny.sprites.front_default,
                maxHP: pokemonAsAny.stats[0].base_stat,
                types: pokemonAsAny.types.map((complexType: any) => complexType.type.name),
            }
        });
        client.db("pokemon").collection("pokemon").insertMany(allPokemon);
    }
    allPokemon.sort((a,b) => a.id - b.id);
    console.log(`Local url: http://localhost:${app.get("port")}`);
});
