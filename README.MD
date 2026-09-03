*This project has been created as a part of the 42 curriculum by [csenelle](https://github.com/Kamisenin), [nrolland](https://github.com/nrollandd), [jmassavi](https://github.com/Djo-msv), [humontas](https://github.com/Diremii) and [thcaquet](https://github.com/Jainek0)*

<span style="font-size: 40px;">**42chan (ft_transcendence)**
</span>

# Description

ft_transcendence is the last project of the 42 main curriculum before entering specialties. Its goal is to familiarize
student to group project and management as well as introduce web development and concrete use of dockers.
The subjects ask 4 to 5 students to create a Website how they want, from a game to something like a Wikipedia it is
possible as long as the students respect they module base of the project. There is a selection of multiple modules
that can be done and gives points, some are bigger than other so they are separate as Minor modules which gives 1 point
and Major modules that gives 2 points. The goal is to reach 14 points to validate the project and 19 for bonus points.

## Overview

> *This ft_transcendence was named as a reference to 4chan, as we don't have any web designer in the team so the Website
doesn't really have any real Artistic Direction. If it were not for some help with AI it would resemble a 2006 blog
like 4chan.*

42chan is a Website that aims to be a middle site between Fandom and Wikipedia, while giving easier and better
page customization and an easy way to reference your pages in the site.
The main features are the Tag and Organization system. <br/>
You can create Pages, Tags and Organization as much as you want, the goal being to organize everything organically
to understand how the system works, we would first create a page about the Federschwert [^1] per example. Now we have our page, 
but it is not referenced properly. So we create the **Federschwert** tag and add it to the page so that when people search for
a specific Federschwert sword, we can give the **Federschwert** tag to other page and the user can go through them and 
find it easily. <br/>
Now we really want to add the **Longsword** tag but it is already owned by someone.
We can request them to review our page and add the **Longsword** tag to the page.
Once it is done you may want to allow a friend to edit the page with you, so give them the direct right on the page.
But there is a problem, you don't think you and your friend can maintain the page properly and that maybe the Longsword
team can maintain it for you, you could give them seperately the rights on your page, but you can also give the rights
to a specific role inside the tag, which will allow the people with this role and above to edit you page and maintain it for you. <br/>

Now there is a last situation you can be in. Maybe the person with th **Longsword** tag has a lot of tags, Like the **Sword** tag,
the **saber** tag, the *One Handed sword* tag and would want to centralize all the permissions of those tags inside one role. <br/>
Introducing **Organizations** <br/>
Organizations allows you to add tags to them and associate roles inside the organization to role inside the managed Tags ! 

[^1]: Federschwert are a type of Longsword that was made in germany during the 16th century with no cutting edge to use it for sports

---
# Instructions

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

---

## SETUP


### NPM installation

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

Then once npm is installed go inside `srcs/next` folder and run ``npm install``
this will install all the dependencies of the project that are listed in the package.json 

---

### Secrets

All the following files **ABSOLUTELY** have to be placed inside the `/secrets/` folder
at the root of the project

#### DATABASE SECRETS

This category is about database passwords, create them wisely as they are at the root of the website,
if they are not strong enough someone could break through the password and have access to the entirety of the Website
```bash
db_root_pwd.txt # is the password of the root user of the database
db_website_pwd.txt # is the password of the WEBSITE database admin
gmail_app_pwd.txt # Your gmail application password for sending automated mail
gmail_user # The associated google account
```

---

## HOW TO RUN

*for this step be sure to have makefile installed on your computer*

### MAKEFILE

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

Lastly for developers there is an option to the makefile to run the NextJs application in development mode and allows
its hot reload option to be used. Simply add ``MODE=dev`` to any command to activate this mode and detach the containers
from your daemon using `d` after all the services are started and healthy to start Nextjs

### Database Setup

if it is the first time you are running this application (in dev mode or production), or you have made a modification to the schema prisma,
you may need to synchronize the database to the schema prisma. There are two ways of doing so.

First the database container must be started for the following actions. Secondly you will have to export the right DATABASE_URL
environment variable set.

For that you can either check the prisma documentation for URL's or just copy the first two line inside the
```bash
dev_start.sh
```
file while on the root folder of the project
Which will create the environment url and add it to your environment. </br>
Then go to the `srcs/next` folder. </br>
For this next section you have two choices of commands to proceed, which will depend on your situation

### 1. ``npx prisma db push``
this is the easiest way of setting up the db, this will add all the tables from the schema prisma into your database.
**🚨 Beware !!! THIS WILL DESTROY ALL THE DATA STORED IN YOUR CURRENT DB, USE WITH PRECAUTION 🚨**

### 2. ``npx prisma migrate deploy``
for this one to work you will first need to create migration files in the prisma project
using the following command : `npx prisma migrate dev --name init`


---

# Team Organization

**Product Owner :** csenelle, whose role was to organize the feature management and work with the two other roles to
give a global direction of the project and the Team.

**Project Manager :** jmassavi, had to organize the team, plan reunions and communications between team members

**Technical lead :** humontas, decided on the technical stack, the technologies that were used and Database organization

**Developers :** jmassavi, humontas, csenelle, nrolland, thcaquet

## Project Management

### Tools

While we tried using Github projects in the beginning, we found it not really user-friendly and preferred using
**Google Docs** to organize the Module that were going to be used and the Technical Stack

---
### Communication

Most, or pretty much all the communication was made on discord, either in private or on the server made for the project

## Features

[x] Customizable Editor : csenelle, jmassavi
> Multiple SlateJs editor combined with React Grid Layout placement to offer a dynamic and customizable page editor

[x] Image Uploads and Management : jmassavi
> A way to upload image inside the website to use for the page editor, manage the images and compress them

[x] Page, Tags and Organizations management : csenelle
> Pages permissions system, that was explained in the overview, allows for role creation and permission edition of said
> roles

[x] AI search software : humontas
> A search service using an AI (non generative) algorithm to find nearest tag, title an description keywords in a specific
> page search

[x] Tester : humontas
> A tester for the website's features

[x] User Management, Authentification and GRDP compliance : nrolland
> 2 factor authentification, registering, login and account management (password change etc.), account suppression and
> GRDP compliance via email confirmation. Management of account suppressions of pages owner

[x] AI page recommendation : thcaquet
> A machine learning based AI that can create profile for users and recommend the next page that the user may want to
> see

[x] Localization and langage Managment : humontas
> A system to change the langage used insied the website, does not apply to the users

[x] Notifications system : humontas
> A notification system for any modifications made inside pages to all the admin users

---
## Modules

#### Web (6pts) :
- Major: Use a framework for both the frontend and backend. (Here NextJS) 
- Minor: A complete notification system for all creation, update, and deletion actions. 
- Minor: Server-Side Rendering (SSR) for improved performance and SEO. 
- Minor: File upload and management system. 
- Minor: Use an ORM for the database.

#### Accessibility and Internationalization (2pts) :
- Minor: Support for multiple languages (at least 3 languages). 
- Minor: Support for additional browsers. 

#### User Management (7pts) :
- Major: Standard user management and authentication. 
- Major: Advanced permissions system 
- Minor: Implement a complete 2FA (Two-Factor Authentication) system for the users.

#### Artificial Intelligence(1pts) :
- Major: Recommendation system using machine learning. 


#### Custom (3pts):

- Minor : Custom Website editor, manage multiple editor at the same time, have

- Major : Advanced AI search software 

TODO : Justify customs !


### Total : 19

---

### Technical Stack


- Framework : 
  - NextJs 

- Frontend :
    - React
    - TailwindCSS
    - UI component libraries : shadcn, lucide-react
    - Rich text Editor : SlateJs
    - ReactGridLayout

- Backend : 
  - NodeJs
  - Prisma ORM
  - PostgreSQL
  - bcrypt (password encrypting)
  - nodemailer, resend (mailing libraries and API)

- Microservices :
  - FastApi and Uvicorn (python API creation)
  - rapidfuzz, ntlk (librairies for fuzzy searching)

- Languages :
  - Typescript (Next)
  - Shell (docker services)
  - Python (AI scripts)
  - Docker (services)

### Database Schema
*beware, it is fat !*



# Resources

- NextJs [documentation](https://nextjs.org/docs)
- 
