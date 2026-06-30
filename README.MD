## Prerequisites

The following tools must be installed on the host machine before working on the project:

| Tool                                       | Minimum Tested Version | Purpose                                        |
|--------------------------------------------|------------------------|------------------------------------------------|
| **Docker Engine**                          | 20.10+                 | Container runtime.                             |
| **GNU Make**                               | 3.81+                  | Build automation through the project Makefile. |
| [**NPM**](/npm-installation)               | 11.13.0+               | Allows you to install the dependencies         |
| Next (dev mode only)                       | 16.2.9                 | allows you to run the app for the dev mode     |
| Prisma                                     | 7.8.0                  | allows you to setup the db for the first time  |
| **Git**                                    | —                      | Source control.                                |

Ensure the Docker daemon is running before executing any command:

```bash
sudo systemctl start docker
```

# SETUP

## NPM installation

First install Node Package Manager (npm)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install --lts
nvm use --lts
```

You can check your installation with
``node -v`` or ``npm -v``

## Prisma Installation

Once node is installed you can just do
```npm i prisma```

## NextJs

Again once node package manager is installed do
```npm i next```

## Secrets

All the following files ABSOLUTELY have to be placed inside the /secrets/ folder
at the root of you repository

### DATABASE SECRETS

This category is about database passwords, create them wisely as they are at the root of the website,
if they are not strong enough someone could break trough the password and destroy all of the Website
```bash
db_root_pwd.txt # is the password of the root user of the database
db_website_pwd.txt # is the password of the WEBSITE database admin
```

# HOW TO RUN

*for this step be sure to have makefile installed on your computer

## MAKEFILE

To run the Web application you will have to use the make command at the root of the repository.
The makefile has 6 rules in total that you can use to manage the application

| Target    | Command                       | Description                                                                                                                                                                |
|-----------|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `upb`     | `make upb `<br/>or<br/>`make` | builds all Docker images and starts every container (`docker compose up --build`). This is the standard first-run command.                                                 |
| `build`   | `make build`                  | builds all images without starting containers. Useful when you only want to verify that all Dockerfiles compile correctly.                                                 |
| `up`      | `make up`                     | Starts all services in the foreground using the existing images. Does not rebuild. Container logs are printed directly to the terminal. Press `Ctrl+C` to stop.            |
| `down`    | `make down`                   | Stops and removes all running containers. Images and volumes remain on disk, making the next `make up` fast.                                                               |
| `clean`   | `make clean`                  | Calls `make down`, then runs `docker system prune -af` to remove all unused images, stopped containers and dangling networks. Volumes are **not** deleted.                 |
| `fclean`  | `make fclean`                 | Stops all containers, removes volumes and orphans (`docker compose down -v --remove-orphans`), prunes the entire Docker system including volumes. This is **irreversible** |
| `re`      | `make re`                     | Runs `make clean` followed by `make upb`. Equivalent to a full teardown and rebuild.                                                                                       |

Lastly for developpers there is an option to the makefile to run the NextJs application in developpment mode and allows
its hot reload option to be use. Simply add ``MODE=dev`` to any command to activate this mode and detach the containers
from your daemon using `d` after all the services are started and healthy to start Nextjs

## Database Setup

if it is the first time you are running this application (in dev mode or production), or you have made a modification to the schema prisma,
you may need to synchronize the database to the schema prisma. There are two ways of doing so.

First the database container must be started for the following actions. Secondly you will have to export the right DATABASE_URL
environnment variable set.

For that you can either check the prisma documentation for URL's or just copy the first two line inside the
```bash
dev_start.sh
```
file
Which will create the environnment url and add it to your environnment. </br>
now that this is done just go to the srcs/next folder. </br>
For this next section you have two choices of commands to proceed, which will depend on your situation

### 1. ``npx prisma db push``
this is the easiest way of setting up the db, this will add all the tables from the schema prisma into your database.
**🚨 Beware !!! THIS WILL DESTROY ALL THE DATA STORED IN YOUR CURRENT DB, USE WITH PRECAUTION 🚨**

### 2. ``npx prisma migrate deploy``
for this one to work you will first need to create migration files in the prisma project
using the following command : `npx prisma migrate dev --name init`