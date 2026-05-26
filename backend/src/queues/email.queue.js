import { Queue }
from "bullmq";

import {
  redisConnection
}
from "../config/redis.js";


export const emailQueue =
  new Queue(

    "email-processing",

    {

      connection:
        redisConnection,

      defaultJobOptions: {

        attempts: 3,

        backoff: {

          type: "exponential",

          delay: 5000

        },

        removeOnComplete: 50,

        removeOnFail: 20

      }

    }

  );