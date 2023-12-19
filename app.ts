import express from "express";
import session from "express-session";
import "dotenv/config";
import { Player, DetailedPokemon, NonDetailedPokemon } from "./interfaces";
import {
  getPlayers,
  getAllPokemon,
  setAllPokemon,
  setPlayers,
  client,
  uri,
  getClient,
} from "./data_access";
import { exit } from "process";
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");

export const app = express();
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const jwtsecret = process.env.JST_SECRET;
if (!jwtsecret) {
  console.log("JWT secret not found!");
  exit(1);
}
app.use(
  session({
    secret: jwtsecret,
    store: MongoStore.create({ mongoUrl: uri }),
    resave: false, // hangt af van de situatie, hover over de parameter voor details
    saveUninitialized: true, // zelfde opmerking
    cookie: { secure: false }, // zelfde opmerking
  })
);

app.set("view engine", "ejs");
const port = process.env.port;
if (!port) {
  console.log("JWT secret not found!");
  exit(1);
}
app.set("port", parseInt(port));

declare module "express-session" {
  export interface SessionData {
    // ENKEL VOOR DIT VOORBEELD - gebruik naam en datatype naar keuze
    // session properties mogen bv. ook objecten zijn
    player: Player;
  }
}

// let op: deze moet ingevuld worden bij opstart van de applicatie

app.get("/", async (req, res) => {
  /*const cookie = req.cookies.playerId;
    if (cookie) {
        res.redirect(`/player/${cookie}`)
    }*/
  const player = req.session.player;
  if (player) {
    res.redirect(`/player/${player.id}`);
  } else {
    const players = getPlayers();
    res.render("index", { players });
  }
});

app.get("/forgetme", async (req, res) => {
  /*res.clearCookie("playerId");
    res.redirect("/")*/
  req.session.destroy(() => res.redirect("/"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const player = getPlayers().find((player) => player.name === username);

  if (username && password) {
    if (player?.password === password) {
      req.session.player = player;
      req.session.save(() => res.redirect(`/player/${player?.id}`));
    }
  } else {
    res.sendStatus(500);
  }
});

app.post("/createPlayer", async (req, res) => {
  const newPlayerId = getPlayers().reduce((acc, player) => {
    if (player.id >= acc) {
      return player.id + 1;
    } else {
      return acc;
    }
  }, 1);
  const newPlayer: Player = {
    name: req.body.name,
    password: req.body.password,
    id: newPlayerId,
    team: [],
  };
  getPlayers().push(newPlayer);
  getClient().db("test").collection("players").insertOne(newPlayer);
  res.redirect("/");
});

app.get("/player/:id", async (req, res) => {
  const player = req.session.player;
  if (player) {
    res.cookie("playerId", req.params.id, { maxAge: 900000, httpOnly: true });
    res.render("player", { player });
  } else {
    res.sendStatus(500);
  }
});

app.get("/player/:id/pokemon", async (req, res) => {
  const player = req.session.player;
  if (player) {
    res.render("pokemon", { pokemon: getAllPokemon(), player });
  } else {
    res.sendStatus(404);
  }
});

app.post("/player/:id/save", async (req, res) => {
  const playerId = parseInt(req.params.id);
  const player = getPlayers().find((p) => p.id === playerId);

  if (player) {
    try {
      await client
        .db("test")
        .collection("players")
        .updateOne({ id: playerId }, { $set: { team: player.team } });

      console.debug(player);
    } catch (error) {
      console.error("Error updating player's team:", error);
      res.sendStatus(500);
      return;
    }
  } else {
    res.sendStatus(404);
    return;
  }

  res.redirect("/player/" + req.params.id);
});

app.post("/player/:id/pokemon/add/:pokeId", async (req, res) => {
  const player = req.session.player;
  const singlePokemon = getAllPokemon().find(
    (singlePokemon) => singlePokemon.id === parseInt(req.params.pokeId)
  );
  if (player && singlePokemon) {
    const randomHP = Math.floor(Math.random() * singlePokemon.maxHP + 1);
    player.team.push({ ...singlePokemon, currentHP: randomHP });
    if (player.team.length === 7) {
      player.team.shift();
    }
    console.debug(player.team);
    res.redirect("/player/" + req.params.id + "/pokemon");
  } else {
    res.sendStatus(404);
  }
});

app.post("/player/:id/pokemon/delete/:pokeId", async (req, res) => {
  const player = req.session.player;
  const deletedPokemonId = parseInt(req.params.pokeId);

  if (player) {
    // Find the index of the Pokemon to be deleted in the player's team
    const deleteIndex = player.team.findIndex(
      (pokemon) => pokemon.id === deletedPokemonId
    );

    if (deleteIndex !== -1) {
      // Remove the Pokemon from the player's team
      player.team.splice(deleteIndex, 1);

      console.debug(player.team);

      // Update the existing player object in the players array

      const index = getPlayers().findIndex((p) => p.id === player.id);
      if (index !== -1) {
        getPlayers()[index] = player;
      }

      req.session.save(() =>
        res.redirect("/player/" + req.params.id + "/pokemon")
      );
    } else {
      res.sendStatus(404);
    }
  } else {
    res.sendStatus(404);
  }
});

app.listen(app.get("port"), async () => {
  await client.connect();
  setPlayers(
    await client.db("test").collection("players").find<Player>({}).toArray()
  );
  setAllPokemon(
    await client
      .db("test")
      .collection("pokemon")
      .find<DetailedPokemon>({})
      .toArray()
  );
  if (getAllPokemon.length === 0) {
    const nonDetailedPokemon: NonDetailedPokemon[] = (
      await (await fetch("https://pokeapi.co/api/v2/pokemon?limit=151")).json()
    ).results;
    const urls = nonDetailedPokemon.map(({ url }) => url);
    const individualResponsePromises: Promise<Response>[] = urls.map((url) =>
      fetch(url)
    );
    const individualResponses: Response[] = await Promise.all(
      individualResponsePromises
    );
    const objectPromises = individualResponses.map((response) =>
      response.json()
    );
    const objects = await Promise.all(objectPromises);
    setAllPokemon(
      objects.map((pokemonAsAny) => {
        return {
          id: pokemonAsAny.id,
          name: pokemonAsAny.name,
          height: pokemonAsAny.height,
          weight: pokemonAsAny.weight,
          image: pokemonAsAny.sprites.front_default,
          maxHP: pokemonAsAny.stats[0].base_stat,
          types: pokemonAsAny.types.map(
            (complexType: any) => complexType.type.name
          ),
        };
      })
    );
    client.db("test").collection("pokemon").insertMany(getAllPokemon());
  }

  console.log(`Local url: http://localhost:${app.get("port")}`);
});
