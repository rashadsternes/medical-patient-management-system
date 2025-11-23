"use server";

import { databases, DATABASE_ID, APPOINTMENT_TABLE_ID, messaging } from "@/lib/appwrite.config";
import { ID, Query } from "node-appwrite";
import { parseStringify, formatDateTime } from "@/lib/utils";
import { Appointment } from "@/types/appwrite.types";
import { revalidatePath } from "next/cache";
import type { CreateAppointmentParams, UpdateAppointmentParams } from "@/types";

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

export const getAppointment = async (appointmentId: string) => {
  try {
    const appointment = await databases.getDocument(
      DATABASE_ID!,
      APPOINTMENT_TABLE_ID!,
      appointmentId
    );

    return parseStringify(appointment);
  } catch (error) {
    console.log(error);
  }
};

export const getRecentAppointmentList = async () => {
  try {
    const appointments = await databases.listDocuments(DATABASE_ID!, APPOINTMENT_TABLE_ID!, [
      Query.orderDesc("$createdAt"),
    ]);

    const initialCounts = {
      scheduledCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
    };

    const counts = (appointments.documents as Appointment[]).reduce((acc, appointment) => {
      if (appointment.status === "scheduled") {
        acc.scheduledCount += 1;
      } else if (appointment.status === "pending") {
        acc.pendingCount += 1;
      } else if (appointment.status === "cancelled") {
        acc.cancelledCount += 1;
      }
      return acc;
    }, initialCounts);

    const data = {
      totalCount: appointments.total,
      ...counts,
      documents: appointments.documents,
    };

    return parseStringify(data);
  } catch (error) {
    console.log(error);
  }
};

export const sendSMSNotification = async (userId: string, content: string) => {
  try {
    const message = await messaging.createSms(ID.unique(), content, [], [userId]);

    return parseStringify(message);
  } catch (error) {
    console.log(error);
  }
};

export const updateAppointment = async ({
  appointmentId,
  userId,
  appointment,
  type,
}: UpdateAppointmentParams) => {
  try {
    const updatedAppointment = await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_TABLE_ID!,
      appointmentId,
      appointment
    );

    if (!updatedAppointment) {
      throw new Error("Appointment not found");
    }

    const smsMessage = `
      Hi, it's CarePulse.
      ${
        type === "schedule"
          ? `Your appointment has been scheduled for ${formatDateTime(appointment.schedule!)}`
          : `We regret to inform that your appointment for has been cancelled for the
      following reason: ${appointment.cancellationReason}`
      }`;
    await sendSMSNotification(userId, smsMessage);

    revalidatePath("/admin");
    return parseStringify(updatedAppointment);
  } catch (error) {
    console.log(error);
  }
};
