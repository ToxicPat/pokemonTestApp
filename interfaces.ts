import { ObjectId } from "mongodb";
export interface Player {
  _id?: ObjectId;
  name: string;
  password: string;
  id: number;
  team: TeamMemberPokemon[];
}

export interface NonDetailedPokemon {
  name: string;
  url: string;
}

export interface DetailedPokemon {
  _id?: ObjectId;
  id: number;
  name: string;
  types: string[]; // verduidelijken dat dit meer gedetailleerd is in 'dex
  image: string;
  height: number;
  weight: number;
  maxHP: number; // verduidelijken dat dit onder stats staat
}

export interface TeamMemberPokemon extends DetailedPokemon {
  currentHP: number;
}
