# <a name="branch"></a> Branch Naming Guidelines

Each branch should be named including the general type of code that the branch is dealing with, as well as a short description of the branch contents. The format of this template is:

`type/name` or `type/github_issue_id`

e.g. `chore/update_contributing_guide` or `fix/253`

This allows for easier at-a-glance viewing of what each branch should contain. If you find you cannot describe the branch accurately with short words, use the github issue ID.

Valid types are listed below, and are the same as the types of commit messages, with one caveat:

* **rc**: A release candidate for a specific build, such as `rc/1.7.0`. RCs need no owner.
* `develop` and `master` have no owner or type

# <a name="commit"></a> Commit Message Guidelines

## Commit Message Format

Each commit message consists of a **header**, a **body** and a **footer**. The header has a special
format that includes a **type** and a **subject**:

```
[<type>] <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

Any line of the commit message cannot be longer 100 characters! This allows the message to be easier
to read on GitLab as well as in various git tools.

## Type

Must be one of the following:

* **feat**: A new feature
* **fix**: A bug fix
* **docs**: Documentation only changes
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing
  semi-colons, etc)
* **refactor**: A code change that neither fixes a bug or adds a feature
* **perf**: A code change that improves performance
* **test**: Adding missing tests
* **chore**: Changes to the build process or auxiliary tools and libraries such as documentation
  generation
* **build**: Changes to the build process

## Subject

The subject contains succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize first letter
* no dot (.) at the end

## Body

Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

## Footer

The footer should contain any information about **Breaking Changes** and is also the place to
reference issues that this commit works on. You should reference your Github workitem here in the format `Closes #NNNNNN` or `References #NNNNNN` where `NNNNNNN` is the item you are working on.
