import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

console.log('Listing Docker containers...');

const listNetworks = async () => {
  const networks = await docker.listNetworks();

  for (const network of networks) {
    console.log(
      `Network ID: ${network.Id}, Name: ${network.Name}, Driver: ${network.Driver}`,
    );
  }
};

const listContainers = async () => {
  const containers = await docker.listContainers();

  for (const container of containers) {
    console.log(
      `Container ID: ${container.Id}, Image: ${container.Image}, Status: ${container.Status}`,
    );
  }
};

const listVolumes = async () => {
  const volumes = await docker.listVolumes();

  for (const volume of volumes.Volumes) {
    console.log(`Volume Name: ${volume.Name}, Driver: ${volume.Driver}`);
  }
};

// listNetworks().catch((err) => {
//   console.error('Error listing Docker networks:', err);
// });
//
// listContainers().catch((err) => {
//   console.error('Error listing Docker containers:', err);
// });
//
// listVolumes().catch((err) => {
//   console.error('Error listing Docker volumes:', err);
// });

docker
  .getNetwork(
    'f9bb1a1e92a46201e7da2d58009e47bb07ca8f3c345fff992a880ee513cf414c',
  )
  .inspect((err, data) => {
    if (err) {
      console.error('Error inspecting Docker network:', err);
    } else {
      console.log('Docker network details:', data);
    }
  });
