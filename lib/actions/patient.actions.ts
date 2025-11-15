"use server";

import { ID, Query } from "node-appwrite";
import {
  PROJECT_ID,
  DATABASE_ID,
  PATIENT_TABLE_ID,
  PUBLIC_BUCKET_ID,
  PUBLIC_ENDPOINT,
  databases,
  storage,
  users,
} from "../appwrite.config";
import { parseStringify } from "../utils";
import { InputFile } from "node-appwrite";

export const createUser = async (user: CreateUserParams) => {
  try {
    const newUser = await users.create(ID.unique(), user.email, user.phone, undefined, user.name);

    return parseStringify(newUser);
  } catch (error: any) {
    if (error && error?.code === 409) {
      const existingUser = await users.list([Query.equal("email", [user.email])]);

      return existingUser.users[0];
    }
    console.error("An error occurred while creating a new user:", error);
  }
};

export const getUser = async (userId: string) => {
  try {
    const user = await users.get(userId);
    return parseStringify(user);
  } catch (error) {
    console.error("An error occurred while fetching the user:", error);
  }
};

export const getPatient = async (userId: string) => {
  try {
    const patients = await databases.listDocuments(DATABASE_ID!, PATIENT_TABLE_ID!, [
      Query.equal("userId", userId),
    ]);
    return parseStringify(patients.documents[0]);
  } catch (error) {
    console.error("An error occurred while fetching the user:", error);
  }
};

export const registerPatient = async ({
  identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    let file;

    if (identificationDocument) {
      const inputFile = InputFile.fromBlob(
        identificationDocument?.get("blobFile") as Blob,
        identificationDocument?.get("fileName") as string
      );

      file = await storage.createFile(PUBLIC_BUCKET_ID!, ID.unique(), inputFile);
    }

    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_TABLE_ID!,
      ID.unique(),
      {
        identificationDocumentId: file?.$id || null,
        identificationDocumentUrl: `${PUBLIC_ENDPOINT}/storage/buckets/${PUBLIC_BUCKET_ID}/files/${file?.$id}/view?project=${PROJECT_ID}`,
        ...patient,
      }
    );

    return parseStringify(newPatient);
  } catch (error) {
    console.log(error);
  }
};
