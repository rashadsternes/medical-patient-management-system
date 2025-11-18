"use server";

import { databases, DATABASE_ID, APPOINTMENT_TABLE_ID } from "@/lib/appwrite.config";
import { ID } from "node-appwrite";
import { parseStringify } from "@/lib/utils";

export const createAppointment = async (appointment: CreateAppointmentParams) => {
  try {
    const newAppointment = await databases.createDocument(
      DATABASE_ID!,
      APPOINTMENT_TABLE_ID!,
      ID.unique(),
      appointment
    );

    return parseStringify(newAppointment);
  } catch (error) {
    console.error("An error occurred while creating the appointment:", error);
  }
};
