# Open Proces Huis (frontend)

This repo holds the [Ember](https://emberjs.com/) project that serves as the frontend of Open Proces Huis. Open Proces Huis is one of many applications developed under the [Agentschap Binnenlands Bestuur (ABB)](https://www.vlaanderen.be/agentschap-binnenlands-bestuur), which is part of the [Flemish Government](https://www.vlaanderen.be/en). It allows for _lokale besturen_ to create and share processes. Such process is created by uploading a BPMN file, and can be populated further with other types of files that serve as attachments. The application also allows for uploading new versions of a process's BPMN file, enabling for a very rudamentary idea of version control.

## Getting started

### Backend

The frontend relies on some backend for proper running. In fact, it relies on a wide range of microservices, each doing its own part. The setup of the complete microservices stack can be found in [this repo](https://github.com/lblod/app-openproceshuis), whose README also stipulates the necessary steps to undertake in order to get the stack running.

### Frontend

> First make sure the backend is up and running.

1. Clone this repository

```bash
git clone https://github.com/lblod/app-openproceshuis.git
```

2. Download the necessary NPM packages

```bash
npm install
```

```bash
cd /path/to/project
```

3. Run the project

```bash
ember serve --proxy "http://localhost:80"
```

4. In your browser, go to [localhost:4200](http://localhost:4200) to enter the homepage of the web application.
