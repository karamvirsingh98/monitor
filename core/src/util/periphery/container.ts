import { Collection, CommandLogError, ContainerStatus, Log, Server } from "@monitor/types";
import { generateQuery } from "@monitor/util";
import axios from "axios";

export async function getPeripheryContainers({ address, passkey }: Server) {
  return (await axios.get(`http://${address}/containers`, {
    headers: {
      Authorization: passkey,
    },
  }).then(({ data }) => data)) as Collection<ContainerStatus>;
}

export async function getPeripheryContainer(
  { address, passkey }: Server,
  name: string
) {
	return (await axios
    .get(`http://${address}/container/${name}`, {
      headers: {
        Authorization: passkey,
      },
    })
    .then(({ data }) => data)) as ContainerStatus | "not created";
}

export async function getPeripheryContainerLog(
  { address, passkey }: Server,
  name: string,
  tail?: number
) {
  return (await axios
    .get(`http://${address}/container/log/${name}${generateQuery({ tail })}`, {
      headers: {
        Authorization: passkey,
      },

    })
    .then(({ data }) => data)) as Log;
}

export async function startPeripheryContainer(
  { address, passkey }: Server,
  name: string
) {
  return (await axios
    .get(`http://${address}/container/start/${name}`, {
      headers: {
        Authorization: passkey,
      },
    })
    .then(({ data }) => data)) as CommandLogError;
}

export async function stopPeripheryContainer(
  { address, passkey }: Server,
  name: string
) {
  return (await axios
    .get(`http://${address}/container/stop/${name}`, {
      headers: {
        Authorization: passkey,
      },
    })
    .then(({ data }) => data)) as CommandLogError;
}

export async function deletePeripheryContainer(
  { address, passkey }: Server,
  name: string
) {
  return (await axios
    .get(`http://${address}/container/delete/${name}`, {
      headers: {
        Authorization: passkey,
      },
    })
    .then(({ data }) => data)) as CommandLogError;
}


