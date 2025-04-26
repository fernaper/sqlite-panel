# SQLite Panel

## Objective

The primary objective of this project is to provide a secure and easy-to-use web-based interface for accessing and managing SQLite databases remotely on servers. It aims to offer a convenient way to view, query, and modify data within SQLite files through a user-friendly interface, adding a layer of security for remote access.

## Motivation

This project was created to simplify the interaction with SQLite databases in remote server environments where traditional database management tools might be inconvenient or unavailable. It provides a quick, secure, and easy way for developers and users to inspect and manipulate SQLite data directly from a web browser, minimizing the need for direct server access or complex setups.

## Technology Stack

This project is built using the following technologies:

- **Frontend & Backend:** Astro (serving API routes), React, TypeScript, Tailwind CSS
- **Database:** Not needed, but of course it connects to your SQLite database

The backend logic for interacting with the SQLite database is handled directly within Astro API routes.

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn
- Docker and Docker Compose (for deployment)

### Development Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd sqlite-panel
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    or
    ```bash
    yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the **root** of the project. You can copy the example file `envs/prod.example.env` as a starting point and configure your settings, such as the path to your SQLite database file and any security credentials.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running at `http://localhost:4321`.

### Production Deployment (using Docker)

This project is designed to be deployed using Docker and Docker Compose.

You have two options, downloading directly from docker hub or building the image yourself.

#### Option 1: Pull from Docker Hub

1.  **Pull the Docker image:**
    ```bash
    docker pull fernaper/sqlite-panel
    ```

2.  **Set up production environment variables:**
    Ensure your `envs/prod.env` file is correctly configured with production settings.

3.  **Run with Docker Compose:**
    ```bash
    docker-compose up -d
    ```
    This will start the application container.
    Take into account that you will need to change the volume path in the `docker-compose.yml` file to point to your SQLite database file. The default path is set to `./data`, but you should change it to the actual path of your SQLite database file.

#### Option 2: Build the Docker image yourself

If you prefer to build the Docker image yourself, follow these steps:

1.  **Build the Docker image:**
    ```bash
    docker build -t sqlite-panel .
    ```

2.  **Set up production environment variables:**
    Ensure your `envs/prod.env` file is correctly configured with production settings.

3.  **Run with Docker Compose:**
    ```bash
    docker-compose up -d
    ```
    This will start the application container.
    Take into account that you will need to change the volume path in the `docker-compose.yml` file to point to your SQLite database file. The default path is set to `./data`, but you should change it to the actual path of your SQLite database file.

**Security Note:** For enhanced security, it is recommended **not** to expose the container's port directly to the host network or public internet. Instead, consider using on-demand port-forwarding to access the web interface securely from your local machine. A convenient tool for Linux-based systems for this purpose is [forward](https://github.com/fernaper/forward), which allows forwarding ports from a remote server or Docker container to your localhost via SSH.

### Optional: Natural Language Query Generation

This application includes an optional feature to generate SQL queries from natural language input, powered by Google Gemini. To enable this, you will need to configure the necessary API keys in your environment variables.

## Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository and submit a pull request. We are especially interested in contributions that add support for integrating with other Large Language Models (LLMs) for the natural language query generation feature.

## License

This project is licensed under the SQLite Panel Internal Use License v1.0.

Public forks are allowed but must include a direct link to this official repository

Commercial use requires a separate agreement. See the [LICENSE](LICENSE) file for more details.

You can use the software for personal or commercial purposes, but you cannot sell it or use it as a service without a separate agreement.

