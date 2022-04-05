import { User } from "@monitor/types";
import {
  CREATE_DEPLOYMENT,
  DELETE_CONTAINER,
  DELETE_DEPLOYMENT,
  DEPLOY,
  PULL_DEPLOYMENT,
  START_CONTAINER,
  STOP_CONTAINER,
  UPDATE_DEPLOYMENT,
} from "@monitor/util";
import { FastifyInstance } from "fastify";
import { WebSocket } from "ws";
import {
  deleteDeploymentContainer,
  startDeploymentContainer,
  stopDeploymentContainer,
} from "./container";
import createDeployment from "./create";
import deleteDeployment from "./delete";
import deployDeployment from "./deploy";
import pullDeploymentRepo from "./pull";
import updateDeployment from "./update";

async function deploymentMessages(
  app: FastifyInstance,
  client: WebSocket,
  message: any,
  user: User
) {
  switch (message.type) {
    case CREATE_DEPLOYMENT:
      const created =
        message.deployment && (await createDeployment(app, user, message));
      if (created) {
        app.broadcast(CREATE_DEPLOYMENT, { deployment: { ...created, status: "not deployed" } });
      }
      return true;

    case DELETE_DEPLOYMENT:
      message.deploymentID && (await deleteDeployment(app, user, message));
      return true;

    case UPDATE_DEPLOYMENT:
      const updated =
        message.deployment && (await updateDeployment(app, user, message));
      if (updated) {
        app.broadcast(UPDATE_DEPLOYMENT, { deployment: updated });
      }
      return true;

    case DEPLOY:
      await deployDeployment(app, user, message);
      return true;

    case START_CONTAINER:
      await startDeploymentContainer(app, user, message);
      return true;

    case STOP_CONTAINER:
      await stopDeploymentContainer(app, user, message);
      return true;

    case DELETE_CONTAINER:
      await deleteDeploymentContainer(app, user, message);
      return true;

    case PULL_DEPLOYMENT:
      await pullDeploymentRepo(app, user, message)
      return true;

    default:
      return false;
  }
}

export default deploymentMessages;
