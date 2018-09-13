# SimpleMVC

## "What is SimpleMVC?"

SimpleMVC is a simple back-end framework that draws insipiration from Rails,
Express, Ember, and Handlebars.

The following features have been implemented so far:

-   ROUTING

    -   Parse query parameters from inbound requests.

    -   Parse properties from the body of a POST or PATCH request.

    -   Extract the method and URL of a request for routing.

    -   Extract dynamic segments from routes.

    -   Load in routes from an external config file (`config/routes.js`).

    -   Handle multiple dynamic segments, and add the data from all such
        segments to the request parameters.

-   CONTROL

    -   Create new custom Controllers by instantiating a Controller class and
        adding methods and properties.

    -   Fire a specific method from a specific controller in response to
        a request.

    -   Execute 'before_action' and 'after_action' callbacks, respectively,
        before and after executing the controller action.

    -   Define new 'before-action' and 'after-action' behaviors on the fly for
        any given action on any given controller.

    -   Render a view after running the action (but before running
        'after-action' callbacks).

-   VIEW

    -   Render a static view template, with no interpolation.

    -   Interpolate the values of variables that are direct properties of a
        given 'context' object.

    -   Render inline helpers that change the properties of data passed in.

    -   Render block helpers that manipulate inner HTML/template content.

    -   Render partial templates within a larger template.

    -   Load default partials and helpers (as part of the view engine), and
        define custom ones at the application layer.

    -   Access and render nested properties (using '.' notation) of variables in
        the rendering context.

## Work Notes

This project was started on Saturday, July 30 2016, and work was more or less abandoned in August 2016; I've reopened this project as of September 2018.

Work still to be done:

### Controllers

-   [ ] Finish making controllers abstract, so that all non-universal code lives in each specific controller file.

-   [ ] Handle rendering within the specific controller file.

### Routing and Views

-   [ ] Make views truly routeable by parsing nested URLs and nesting templates
    appropriately withing `<$outlet$>` tags.

-   [ ] Handle requests for static assets (e.g. CSS stylesheets, favicons).

-   [ ] Serve up error pages in the event of an error.

### Models/Data

-   [ ] Define a model abstraction

### App Management

-   [ ] Further extend changes to the system's object model so that true
    inheritance is possible.

-   [ ] Create a general error-handling system.

-   [ ] Auto-load controllers, views, and models on startup by traversing the file tree.

-   [ ] Add some kind of shortcut for resource routing.

-   [ ] Add a command-line generator for creating new controller/model/view files.
