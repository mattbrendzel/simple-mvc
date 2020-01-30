# SimpleMVC

## "What is SimpleMVC?"

SimpleMVC is a simple back-end JavaScript framework that draws insipiration from Rails,
Express, Ember, and Handlebars.

## Work Notes

This project was started in July 2016 and worked on for about a month. I briefly revisited it in 2018, but
had to put it on ice when I started a new job. As of January 2020, I have reopened this project to see if I can finish what I started.

## FEATURE ROADMAP

### Request Routing
<details>

  - [x]   Parse query parameters from inbound requests.

  - [x]   Parse properties from the body of a POST or PATCH request.

  - [x]   Extract the method and URL of a request for routing.

  - [x]   Extract dynamic segments from routes.

  - [x]   Load in routes from an external config file (`config/routes.js`).

  - [x]   Handle multiple dynamic segments, and add the data from all such segments to the request parameters.

</details>

### Request Handling

<details>
  - [x]   Create new custom Controllers by instantiating a Controller class and adding methods and properties.

  - [x]   Fire a specific method from a specific controller in response to a request.

  - [x]   Execute 'before_action' and 'after_action' callbacks, respectively, before and after executing the controller action.

  - [x]   Define new 'before-action' and 'after-action' behaviors on the fly for any given action on any given controller.

  - [x]   Render a view after running the action (but before running 'after-action' callbacks).

  - [x]   Finish making controllers abstract, so that all non-universal code lives in each specific controller file.

  - [ ]   Parse nested URLs so that nested views can be rendered.

  - [x]   Handle requests for CSS and JavaScript files.

  - [ ]   Handle requests for images and favicons.

  - [ ]   Serve up error pages in the event of an error.

</details>

### View Rendering

<details>
  - [x]   Render a static view template, with no interpolation.

  - [x]   Interpolate the values of variables that are direct properties of a given 'context' object.

  - [x]   Render inline helpers that change the properties of data passed in.

  - [x]   Render block helpers that manipulate inner HTML/template content.

  - [x]   Render partial templates within a larger template.

  - [x]   Load default partials and helpers (as part of the view engine), and define custom ones at the application layer.

  - [x]   Access and render nested properties (using '.' notation) of variables in the rendering context.

  - [x]   Handle rendering within the specific controller file.

  - [ ]   Render mutliple nested view templates within the appropriately `<$outlet$>` tags.

</details>

### Database Integration

<details>

  - [ ]  Create and manage a connection with a Postgres database (eventually, more database types).

  - [ ]  Create a SQL syntax generator for basic CRUD operations.

  - [ ]  Define a model abstraction and use it to perform SQL queries and operations.

  - [ ]  Generalize the model by creating standardized methods for data manipulation.

  - [ ]  Make models heritable.

</details>

### General

<details>

  - [ ]  Further extend changes to the system's object model so that true inheritance is possible.

  - [ ]  Create a general error-handling system.

  - [ ]  Auto-load controllers, views, and models on startup by traversing the file tree.

  - [ ]  Add some kind of shortcut for resource routing.

  - [ ]  Add a command-line generator for creating new controller/model/view files.

</details>
