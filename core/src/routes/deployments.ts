import {
  getContainerLog,
  getContainerStatus,
  intoCollection,
  DEPLOYMENT_OWNER_UPDATE,
} from "@monitor/util";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { deploymentStatusLocal } from "../util/deploymentStatus";
import {
  getPeripheryContainer,
  getPeripheryContainerLog,
  getPeripheryContainers,
} from "../util/periphery/container";

const deployments = fp((app: FastifyInstance, _: {}, done: () => void) => {
  app.get(
    "/api/deployments",
    { onRequest: [app.auth, app.userEnabled] },
    async (req, res) => {
      // returns the periphery deployments on the given serverID
      // returns the core deployments if no serverID is specified
      const { serverID } = req.query as { serverID?: string };
      const server = serverID ? await app.servers.findById(serverID) : app.core;
      if (!server) {
        res.status(400);
        res.send();
        return;
      }
      const deployments = await app.deployments.find(
        { serverID: server._id },
        "name containerName serverID owners repo"
      );
      const status = server.isCore
        ? await deploymentStatusLocal(app)
        : await getPeripheryContainers(server);
      res.send(
        intoCollection(
          deployments.map((deployment) => ({
            ...deployment,
            status: status[deployment.containerName!] || "not deployed",
          }))
        )
      );
    }
  );

  app.get(
    "/api/deployment/:id",
    { onRequest: [app.auth, app.userEnabled] },
    async (req, res) => {
      const { id } = req.params as { id: string };
      const deployment = await app.deployments.findById(id);
      if (!deployment) {
        res.status(400);
        res.send("could not find deployment");
        return;
      }
      const onCore = deployment.serverID === app.core._id;
      const server = onCore
        ? app.core
        : await app.servers.findById(deployment.serverID!);
      if (!server) {
        res.status(400);
        res.send("could not find deployment's server");
        return;
      }
      deployment.status = onCore
        ? await getContainerStatus(app.dockerode, deployment.containerName!)
        : await getPeripheryContainer(server, deployment.containerName!);
      res.send(deployment);
    }
  );

  app.get(
    "/api/deployment/:id/log",
    { onRequest: [app.auth, app.userEnabled] },
    async (req, res) => {
      const { id } = req.params as { id: string };
      const { tail } = req.query as { tail?: number };
      const deployment = await app.deployments.findById(
        id,
        "serverID containerName"
      );
      if (!deployment) {
        res.status(400);
        res.send("could not find deployment");
        return;
      }
      const onCore = deployment.serverID === app.core._id;
      const server = onCore
        ? app.core
        : await app.servers.findById(deployment.serverID!);
      if (!server) {
        res.status(400);
        res.send("could not find deployment's server");
        return;
      }
      const log = onCore
        ? await getContainerLog(deployment.containerName!, tail || 50)
        : await getPeripheryContainerLog(
            server,
            deployment.containerName!,
            tail || 50
          );
      res.send(log);
    }
  );

  app.get(
    "/api/deployment/:id/status",
    { onRequest: [app.auth, app.userEnabled] },
    async (req, res) => {
      const { id } = req.params as { id: string };
      const deployment = await app.deployments.findById(
        id,
        "serverID containerName"
      );
      if (!deployment) {
        res.status(400);
        res.send("could not find deployment");
        return;
      }
      const onCore = deployment.serverID === app.core._id;
      const server = onCore
        ? app.core
        : await app.servers.findById(deployment.serverID!);
      if (!server) {
        res.status(400);
        res.send("could not find deployment's server");
        return;
      }
      const status = onCore
        ? await getContainerStatus(app.dockerode, deployment.containerName!)
        : await getPeripheryContainer(server, deployment.containerName!);
      res.send(status);
    }
  );

  app.get(
    "/api/deployment/:id/action-state",
    { onRequest: [app.auth, app.userEnabled] },
    async (req, res) => {
      const { id } = req.params as { id: string };
      const state = app.deployActionStates.getJSON(id);
      res.send(state);
    }
  );

  app.post(
    "/api/deployment/:id/:owner",
    { onRequest: [app.auth, app.userEnabled] },
    async (req, res) => {
      // adds an owner to a deployment
      const { id, owner } = req.params as { id: string; owner: string };
      const sender = (await app.users.findById(req.user.id))!;
      if (sender.permissions! < 1) {
        res.status(403);
        res.send("inadequate permissions");
        return;
      }
      const user = await app.users.findOne({ username: owner });
      if (!user || user.permissions! < 1) {
        res.status(400);
        res.send("invalid user");
        return;
      }
      const deployment = await app.deployments.findById(id);
      if (!deployment) {
        res.status(400);
        res.send("deployment not found");
        return;
      }
      if (
        sender.permissions! < 2 &&
        !deployment.owners.includes(sender.username)
      ) {
        res.status(403);
        res.send("inadequate permissions");
        return;
      }
      await app.deployments.updateById(id, { $push: { owners: owner } });
      app.broadcast(DEPLOYMENT_OWNER_UPDATE, { deploymentID: id });
      res.send("owner added");
    }
  );

  app.delete(
    "/api/deployment/:id/:owner",
    { onRequest: [app.auth, app.userEnabled] },
    async (req, res) => {
      // removes owner from deployment
      const { id, owner } = req.params as { id: string; owner: string };
      const sender = (await app.users.findById(req.user.id))!;
      if (sender.permissions! < 2) {
        res.status(403);
        res.send("inadequate permissions");
        return;
      }
      const deployment = await app.deployments.findById(id);
      if (!deployment) {
        res.status(400);
        res.send("deployment not found");
        return;
      }
      await app.deployments.updateById(id, { $pull: { owners: owner } });
      app.broadcast(DEPLOYMENT_OWNER_UPDATE, { deploymentID: id });
      res.send("owner removed");
    }
  );

  done();
});

export default deployments;
