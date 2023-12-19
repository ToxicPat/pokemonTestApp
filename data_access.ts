import { all } from "axios";
import { Player, DetailedPokemon, NonDetailedPokemon } from "./interfaces";
import { MongoClient, ObjectId } from "mongodb";
import { parse } from "path";
import { exit } from "process";
import "dotenv/config";

export const uri = process.env.mongoUri;
if (!uri) {
  console.log("Uri not found!");
  exit(1);
}
export let client = new MongoClient(uri);

let localPlayer: Player[];
let allPokemon: DetailedPokemon[] = [];
export function getPlayers(): Player[] {
  return localPlayer;
}

export function setPlayers(players: Player[]) {
  localPlayer = players;
}

export function getAllPokemon(): DetailedPokemon[] {
  return allPokemon;
}

export function setAllPokemon(pokemon: DetailedPokemon[]) {
  allPokemon = pokemon.sort((a, b) => a.id - b.id);
  /*allPokemon.sort((a, b) => a.id - b.id);*/
}
export function getClient() {
  return client;
}
export function setClient(newClient: MongoClient) {
  client = newClient;
}
