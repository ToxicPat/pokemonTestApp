import {
  getPlayers,
  setAllPokemon,
  setClient,
  setPlayers,
  getClient,
} from "./data_access";
import request from "supertest";
import { app } from "./app";
import exp from "constants";
import { Collection } from "mongodb";

const fakeClient = {
  db: (_: any) => {
    return {
      collection: (_: any) => {
        return {
          insertOne: (_: any) => jest.fn(),
        };
      },
    };
  },
};
beforeEach(() => {
  setAllPokemon([
    {
      id: 1,
      name: "bulbasaur",
      height: 7,
      weight: 69,
      image:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
      maxHP: 45,
      types: ["grass", "poison"],
    },
  ]);

  setPlayers([
    {
      name: "RED",
      password: "RED",
      id: 1,
      team: [],
    },
  ]);
});

describe("GET /", () => {
  it("should return a page containing two forms when there is no session", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toContain(
      `form action="/createPlayer" method="POST"`
    );
    expect(response.text).toContain(`form action="/login" method="POST"`);
    expect(response.text).toContain(`RED`);
  });
});
afterEach(() => jest.clearAllMocks());
describe("POST /createPlayer", () => {
  it("should return a page containing two forms when there is no session", async () => {
    const response = await request(app).post("/createPlayer");
    const mockData = [{ name: "GREEN", passowrd: 42, id: 11, team: [] }];
    const mockClient = {
      db: (_dbname: string) => {
        return {
          collection: (_collectionName: string) => {
            return {
              find: (_filter: object) => {
                return { toArray: jest.fn().mockResolvedValue(mockData) };
              },
            };
          },
        };
      },
    };
    expect(response.status).toBe(302);
    expect(response.text).toContain("Found. Redirecting to /");
    /*expect(getPlayers).toContainEqual({
      name: "GREEN",
      passowrd: 42,
      id: 11,
      team: [],
    });*/
    expect(fakeClient.db("").collection("").insertOne({}));
  });
});

afterEach(() => jest.clearAllMocks());
describe("POST /player", () => {
  it("should return a page containing two forms when there is no session", async () => {
    const response = await request(app).post("/createPlayer");
    const mockData = [{ name: "GREEN", passowrd: 42, id: 11, team: [] }];
    const mockClient = {
      db: (_dbname: string) => {
        return {
          collection: (_collectionName: string) => {
            return {
              find: (_filter: object) => {
                return { toArray: jest.fn().mockResolvedValue(mockData) };
              },
            };
          },
        };
      },
    };
    expect(response.status).toBe(302);
    expect(response.text).toContain("Found. Redirecting to /");
    console.debug(getPlayers);
    expect(getPlayers.name);
    /*expect(getPlayers).toContainEqual({
      name: "GREEN",
      passowrd: 42,
      id: 11,
      team: [],
    });*/
    expect(fakeClient.db("").collection("").insertOne({}));
  });
});

afterEach(() => jest.clearAllMocks());
