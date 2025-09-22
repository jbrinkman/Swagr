---
inclusion: always
---

# Commit Standards

## Developer Certificate of Origin (DCO)

All commits MUST include the DCO signoff to certify that the contributor has the right to submit the code under the project's license.

### Required Signoff

Every commit must include the `-s` or `--signoff` flag:

```bash
git commit -s -m "feat: add user authentication service"
```

This adds the following line to your commit message:

```
Signed-off-by: Your Name <your.email@example.com>
```

### What DCO Means

By signing off, you certify that:

- You wrote the code yourself, or
- You have the right to pass on the code as open source, and
- The contribution is made under the project's license

## Conventional Commits Format

All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Required Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

### Examples

```bash
# Feature addition
git commit -s -m "feat(auth): add Firebase authentication service"

# Bug fix
git commit -s -m "fix(contacts): resolve duplicate contact creation issue"

# Documentation
git commit -s -m "docs: update README with setup instructions"

# Breaking change
git commit -s -m "feat(api)!: change contact data structure

BREAKING CHANGE: Contact model now requires enterpriseName field"
```

### Scope Guidelines

Use scopes to indicate the area of the codebase:

- `auth`: Authentication related changes
- `contacts`: Contact management features
- `years`: Year management functionality
- `ui`: User interface components
- `api`: API/service layer changes
- `config`: Configuration changes
- `deps`: Dependency updates

### Commit Message Rules

1. Use the imperative mood in the subject line ("add" not "added" or "adds")
2. Do not end the subject line with a period
3. Capitalize the subject line
4. Limit the subject line to 50 characters
5. Separate subject from body with a blank line
6. Wrap the body at 72 characters
7. Use the body to explain what and why vs. how

### Pre-commit Validation

Before committing, ensure your commit message:

- [ ] Includes DCO signoff (`-s` flag used)
- [ ] Follows conventional commits format
- [ ] Has a clear, descriptive subject line
- [ ] Uses appropriate type and scope
- [ ] Explains the "why" in the body if needed

### Tools and Automation

Consider using these tools to enforce standards:

- `commitizen` for interactive commit message creation
- `husky` with `commitlint` for automated validation
- Git hooks to prevent commits without signoff

### Example Workflow

```bash
# Make your changes
git add .

# Commit with proper format and signoff
git commit -s -m "feat(contacts): implement contact form validation

Add client-side validation for required fields (firstName, lastName, enterpriseName).
Includes real-time error display and form submission prevention for invalid data.

Closes #123"
```

## Enforcement

All pull requests will be reviewed for compliance with these commit standards. Non-compliant commits will be rejected and must be amended before merge.
