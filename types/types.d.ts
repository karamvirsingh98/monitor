export interface Collection<T> {
  [index: string]: T;
}

export type BuildActionStates = Collection<BuildActionState>;
export type DeployActionStates = Collection<DeployActionState>;
export type Servers = Collection<Server>;
export type Builds = Collection<Build>;
export type Deployments = Collection<Deployment>;

export type User = {
  _id?: string;
  username: string;
  permissions?: number;
  password?: string;
  githubID?: number;
  avatar?: string;
};

export type Action = {
  type: string;
  userID: string;
};

export type Log = {
  stdout?: string;
  stderr?: string;
};

export type Update = {
  _id?: string;
  buildID?: string;
  deploymentID?: string;
  serverID?: string;
  operation: string;
  command: string;
  log: Log;
  timestamp: number;
  note: string;
  isError?: boolean;
  operator: string; // the userID or username
};

export type Server = {
  _id?: string;
  name: string;
  address: string;
  passkey: string;
  port: string;
  status: "OK" | "Incorrect Password" | "Could Not Be Reached";
  enabled: boolean;
};

export type DockerBuildArgs = {
  buildPath: string; // build folder relative to repo root
  dockerfilePath: string; // relative to buildPath
  imageName: string;
};

export interface Build extends DockerBuildArgs {
  _id?: string;
  name: string;
  repo?: string;
  branch?: string;
  accessToken?: string; // to gain access to private repos
  owner: string; // userID / username
}

export type DockerRunArgs = {
  image: string;
  containerName?: string; // also for auto pull of repo, will be set by time deployment created
  latest?: boolean; // if custom image, use this to add :latest
  ports?: Conversion[];
  environment?: EnvironmentVar[];
  network?: string;
  volumes?: Volume[];
  restart?: string;
  postImage?: string; // interpolated into run command after the image string
  containerUser?: string; // after -u in the run command
};

export interface Deployment extends DockerRunArgs {
  _id?: string;
  name: string;
  owner: string;
  serverID?: string; // only added if running on periphery server
  buildID?: string; // if deploying a monitor build
  /* to manage repo for static frontend, mounted as a volume. locally in REPO_ROOT/containerName */
  repo?: string; 
  branch?: string;
  accessToken?: string;
  containerMount?: string; // the file path to mount repo on inside the container
}

export type Conversion = {
  local: string;
  container: string;
};

export interface Volume extends Conversion {
  useSystemRoot?: boolean;
}

export type EnvironmentVar = {
  variable: string;
  value: string;
};

export type BuildActionState = {
  pulling: boolean;
  building: boolean;
};

export type DeployActionState = {
  deploying: boolean;
  deleting: boolean;
  starting: boolean;
  stopping: boolean;
};

export type ContainerStatus = {
  name: string;
  deploymentID?: string;
  Status: string;
  State: "running" | "exited";
};

export type EntityCollection = {
  _id?: string;
  name: string;
  deploymentIDs: string[];
  buildIDs: string[];
  owner: string; // userID
};

export type CommandLogError = {
  command: string;
  log: Log;
  isError: boolean;
}
