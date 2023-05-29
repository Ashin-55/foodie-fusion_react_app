import { Client, Account, ID, Databases } from "appwrite";

const client = new Client();
client.setEndpoint("http://localhost:88/v1").setProject("64746ed9ca12f1a3ebd3");
export const account = new Account(client);
export const databases = new Databases(client, "64746fb9d3e43dcffde5 ");

