import axios from 'axios';

import { env } from '../config/env';

export interface BookingRequest {
  tenantId: string;
  eventType: string;
  customerName: string;
  customerEmail: string;
  notes?: string;
  startsAt: string;
}

export class SchedulingService {
  async createBooking(payload: BookingRequest) {
    if (!env.CALCOM_API_KEY) {
      return {
        status: 'pending-activation',
        bookingUrl: null
      };
    }

    try {
      const response = await axios.post(
        `${env.CALCOM_BASE_URL ?? 'https://api.cal.com/v2'}/bookings`,
        {
          eventTypeSlug: payload.eventType,
          name: payload.customerName,
          email: payload.customerEmail,
          startTime: payload.startsAt,
          notes: payload.notes
        },
        {
          headers: {
            Authorization: `Bearer ${env.CALCOM_API_KEY}`
          }
        }
      );

      return {
        status: 'confirmed',
        bookingUrl: response.data?.booking?.cancellationLink ?? null,
        externalId: response.data?.booking?.id
      };
    } catch (error) {
      return {
        status: 'provider-failed',
        bookingUrl: null,
        externalId: null,
        error: 'calcom_error'
      };
    }
  }
}