# aibox

## Project Overview

_aibox_ is an AI-powered solution designed to streamline tasks and boost productivity for small to mid-sized companies. It enhances efficiency and drives innovation in workflows through a modular web application that consists of two main components:

1. **Prompt Library**: Users can manage and customize a library of prompts tailored to their specific needs and workflows.

2. **Custom Implemented Modules**: These are specialized functionalities that companies can purchase separately. For example, a transcription service for Somedia's TV production team.

The application is built with a focus on simplicity and scalability, allowing companies to choose the features that best suit their needs.

### Key Features

- Customizable AI prompt management
- Modular architecture allowing for easy addition of new functionalities
- Multi-tenancy support for serving multiple companies
- Role-based access control for secure and organized usage
- Integration of LLMs using LangChain, enabling simple implementations of advanced workflows and setups in the future
- Scalable and serverless cloud-based infrastructure
- Simple theming to reflect the customer's corporate identity

## Principles

For _aibox_, we follow these core principles and methodologies to guide our development process:

1. **User-Centric Development**:

   - Prioritize features and improvements that provide direct value to users.
   - Regularly seek and incorporate user feedback into the development process.
   - Focus on creating a highly accessible product.

2. **Simplicity First**:

   - Keep the codebase, its dependencies, architecture, and user interfaces as simple as possible.
   - Avoid unnecessary complexity that doesn't add immediate value.

3. **YAGNI (You Aren't Gonna Need It)**:

   - Don't build features or capabilities that aren't immediately necessary.
   - Focus on current requirements rather than speculative future needs.
   - Design solutions that are sufficient for the current problem, not for every possible future scenario.
   - Refactor and expand as needs arise, rather than trying to anticipate every possibility upfront.

4. **[Modularity](https://www.geeksforgeeks.org/inroduction-to-modularity-and-interfaces-in-system-design/), [Locality of Behavior](https://htmx.org/essays/locality-of-behaviour/), and [Coupling/Cohesion](https://www.geeksforgeeks.org/software-engineering-coupling-and-cohesion/)**:

   - Design the system with modularity in mind, creating self-contained components with clear interfaces.
   - Strive for locality of behavior, where related functionality and data are kept close together.
   - Aim for low coupling between modules and high cohesion within modules:
     - Low Coupling: Minimize dependencies between different parts of the application.
     - High Cohesion: Keep related functionality together within a module.
   - This approach enhances maintainability, testability, and allows for easier future modifications or expansions of the system.

5. **Maintainability**:

   - Write clean, well-documented code that's easy for other developers to understand and maintain.
   - Use consistent coding standards and patterns across the project.
   - Communicate clearly and frequently with team members.
   - Use version control effectively, with meaningful commit messages and well-structured pull requests.

6. **Continuous Improvement**:

   - Regularly review and refactor code to keep it clean and efficient.
   - Stay updated with the latest best practices and technologies relevant to our stack.

7. **Security Mindset**:

   - Apply a zero-trust policy for **any** external data.
   - Always consider security implications in design and implementation decisions.
   - **Never** compromise on data protection and user privacy.

8. **Performance Matters**:

   - Consider performance implications of code changes.
   - Regularly monitor and optimize application performance.

9. **Embrace Change**:

   - Be open to new ideas and approaches that can improve the project.
   - Stay flexible and adaptable as the project and its requirements evolve.

## Project Architecture

1. **Frontend**: Astro + Svelte

   - Astro the web framework
   - Svelte for interactive components
   - TailwindCSS and DaisyUI for styling

2. **Backend**: Astro on Netlify Functions (serverless)

   - Astro runs on serverless functions on Netlify
   - Netlify comes with a lot of features and very low config and maintenance overhead
   - Server side rendering and API endpoints

3. **Database**: MongoDB Atlas

   - Stores user data, prompts, and general application state

4. **Authentication**: Auth0 & Lucia

   - Handles user authentication and authorization
   - Sessions are separately managed by us

5. **File Storage**: AWS S3

   - General blob storage
   - Stores audio files for transcription

## Technology Stack

### App

1. **Astro**

   - Web framework
   - Focuses and server side rendering and works with any UI framework
   - Key concept: Astro islands for interactive components

2. **Svelte**

   - Used for building interactive UI components

3. **TailwindCSS**

   - Utility-first CSS framework
   - Configure in `tailwind.config.js`

4. **DaisyUI**

   - Component library built on top of TailwindCSS
   - Provides pre-built components and themes
   - Comes with themeing

5. **TypeScript**

   - Used throughout the project for type safety
   - Configure in `tsconfig.json`

6. **Netlify Functions running Astro in server mode**

   - Uses the official adapter for Astro [https://docs.astro.build/en/guides/integrations-guide/netlify/](https://docs.astro.build/en/guides/integrations-guide/netlify/)
   - Serverless functions

7. **LangChain**

   - Used for building AI/LLM-powered applications
   - Helps in managing conversations, prompts, and AI model interactions

8. **Zod**

   - Used for input validation in API endpoints, forms and data from MongoDB
   - Define schemas for expected data structures

9. **Lucia**

   - Used for implementing Auth0 IAM
   - Session management

### Package Manager

- **pnpm**: Fast, disk space efficient package manager

### Database

1. **MongoDB Atlas**

   - Cloud-hosted MongoDB service
   - Connection string stored in environment variables
   - Use MongoDB driver database operations and Zod for schema validation

### File Storage and Processing

1. **AWS S3**

   - Used for storing audio files and transcriptions

## Project Structure

```
aibox/
├── src/
│   ├── auth             # Lucia and Auth0 setup
│   ├── components       # Astro and Svelte components
│   ├── content          # Content files as Markdown
│   ├── data             # MongoDB connection and data schema
│   ├── i18n             # Translations
│   ├── layouts          # Astro layouts
│   ├── pages            # Astro pages used for routing
│   ├── styles           # Global styles
│   ├── utils            # Utility functions
│   ├── env.d.ts         # Globally available types
│   └── middleware.ts    # Request middleware
├── public/              # Static assets
├── .env                 # Environment variable template
├── .prettierrc.mjs      # Prettier configuration
├── astro.config.mjs     # Astro configuration
├── eslint.config.js     # ESLint configuration
├── svelte.config.js     # Svelte configuration
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── package.json
```

## Quickstart

To get the project up and running on your local machine, follow these steps:

1. Clone the repository:

```
git clone https://github.com/AI-now-AG/ai-toolbox.git
cd ai-toolbox
```

2. Copy the environment file:

```
cp .env .env.local
```

3. Edit `.env.local` and add your personal API keys and credentials.

4. Install dependencies:

```
pnpm i
```

5. Start the development server:

```
pnpm dev
```

6. Open your browser and navigate to `http://localhost:4321`. The app should now be running.

## Editor Setup

To ensure a consistent development experience and maintain code quality, ensure your editor integrates well with TypeScript, Astro, Svelte, Prettier and ESLint. Because these are common frameworks and tools there are plugins for every major and even some niche editors available - install them as needed.

## Development Workflow

1. **Feature Development**

   - Create a new branch from `main`: `git checkout -b feature/your-feature-name`
   - Develop the feature locally
   - Commit changes frequently: `git commit -m "Descriptive commit message"`
   - Push your branch: `git push origin feature/your-feature-name`

2. **Code Review Process**

   - Open a Pull Request (PR) on GitHub
   - Assign reviewers and wait for approval
   - Address any comments or requested changes
   - Get further approval from the product owner using the preview link as needed
   - Once approved, merge the PR into `main`

3. **Continuous Integration**

   - GitHub Actions will run tests and linting on every push
   - Preview deployments are created for each PR

4. **Deployment**

   - Merges to `main` trigger automatic deployment to production
   - Monitor the deployment in Netlify dashboard

## Multi-tenancy and Permissions

- Tenants are user relations to them are managed in Auth0 while we keep the tenant config in our MongoDB.
- User roles are managed in Auth0. They are at the time of writing:
  - **User**: Reading rights
  - **Admin**: Can edit and add prompts and related objects
  - **Super Admin**: AI now user to add features like tenant switching, theme previewing and so on in the future.
- Permissions are stored in our MongoDB and mapped to roles.
- Use permissions for managing access.

## Testing

- There is currently no testing workflow implemented.

## Security Best Practices

There are not a lot of security measurements implemented at the time of writing, so keep this in mind:

- Regularly update dependencies and address security vulnerabilities
- Use environment variables for all sensitive information
- Implement proper error handling to avoid information leakage
- **Common pitfall: Differentiate between server and client. Only import libraries and data in Svelte components that have to be in the client. Keep as much as possible on the server. Otherwise not only performance will suffer, but we're at risk of leaking sensitive data.**

Future possibilities:

- Add automatic code scanning for vulnerabilities.
- Add a secrets management service like AWS SSM.
- Use Content Security Policy (CSP) headers
- Implement rate limiting on API endpoints to prevent abuse

## Monitoring and Logging

- Use Netlify's built-in monitoring for server-side functions
- Implement application-level logging for important events and errors

Future possibilities:

- Consider using a service like Sentry for error tracking

## Supported Browsers

We're focused on the swiss market and target all browsers with a usage of >1% in Switzerland.

[https://browserslist.dev/?q=PiAxJSBpbiBDSA%3D%3D](https://browserslist.dev/?q=PiAxJSBpbiBDSA%3D%3D)

## Important Links and Resources

- **Project Repository**: [https://github.com/AI-now-AG/ai-toolbox](https://github.com/AI-now-AG/ai-toolbox)
- **Production Environment**: [https://ainow-aibox.netlify.app](https://ainow-aibox.netlify.app)
- **Issue Tracker**: [https://ainow.atlassian.net/jira/software/c/projects/AINOW/boards/4](https://ainow.atlassian.net/jira/software/c/projects/AINOW/boards/4)
- **Figma** [https://www.figma.com/design/fhxdRqUV2hI0QhdLCEAncF/daisyUI-AI-Toolbox](https://www.figma.com/design/fhxdRqUV2hI0QhdLCEAncF/daisyUI-AI-Toolbox)
- **Netlify Dashboard**: [https://app.netlify.com/sites/ainow-aibox/overview](https://app.netlify.com/sites/ainow-aibox/overview)
- **CI/CD Pipeline**: [https://app.netlify.com/sites/ainow-aibox/deploys](https://app.netlify.com/sites/ainow-aibox/deploys)

### Documentation

- **Astro Docs**: [https://docs.astro.build/](https://docs.astro.build/)
- **Svelte Docs**: [https://svelte.dev/docs](https://svelte.dev/docs)
- **TailwindCSS Docs**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **DaisyUI Docs**: [https://daisyui.com/](https://daisyui.com/)
- **TypeScript Docs**: [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)
- **Zod Docs**: [https://zod.dev/](https://zod.dev/)
- **LangChain Docs**: [https://js.langchain.com/docs/](https://js.langchain.com/docs/)
- **Auth0 API**: [https://auth0.com/docs/api](https://auth0.com/docs/api)
- **Lucia** Docs: [https://lucia-auth.com/](https://lucia-auth.com/)

### Services

- **MongoDB Atlas Dashboard**: [https://cloud.mongodb.com](https://cloud.mongodb.com)
- **AWS Console**: [https://aws.amazon.com/console/](https://aws.amazon.com/console/)
- **Auth0 Dashboard**: [https://manage.auth0.com/](https://manage.auth0.com/)

### Learning Resources

- **Astro Tutorial**: [https://docs.astro.build/en/tutorial/0-introduction/](https://docs.astro.build/en/tutorial/0-introduction/)
- **Svelte Tutorial**: [https://svelte.dev/tutorial/basics](https://svelte.dev/tutorial/basics)
- **LangChain Tutorials** [https://js.langchain.com/docs/tutorials/](https://js.langchain.com/docs/tutorials/)
- **TailwindCSS Screencasts**: [https://www.youtube.com/tailwindlabs](https://www.youtube.com/tailwindlabs)

Remember to update this documentation as the project evolves.

Good luck ❤️
