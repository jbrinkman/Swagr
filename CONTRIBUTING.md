# Contributing to Marketing Checklist App

Thank you for your interest in contributing to the Marketing Checklist App! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct. Please be respectful and professional in all interactions.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Test your changes thoroughly
6. Submit a pull request

## Development Setup

Please refer to the [README.md](README.md) for detailed setup instructions.

## Commit Standards

All commits must follow our commit standards:

### Developer Certificate of Origin (DCO)

All commits MUST include the DCO signoff to certify that you have the right to submit the code:

```bash
git commit -s -m "feat: add user authentication service"
```

### Conventional Commits Format

All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Required Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

#### Scope Guidelines

- `auth`: Authentication related changes
- `contacts`: Contact management features
- `years`: Year management functionality
- `ui`: User interface components
- `api`: API/service layer changes
- `config`: Configuration changes
- `deps`: Dependency updates

#### Examples

```bash
git commit -s -m "feat(auth): add Firebase authentication service"
git commit -s -m "fix(contacts): resolve duplicate contact creation issue"
git commit -s -m "docs: update README with setup instructions"
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` type unless absolutely necessary
- Use strict mode configuration

### React Native/Expo

- Follow React Native best practices
- Use functional components with hooks
- Implement proper error boundaries
- Follow Expo development guidelines

### Code Style

- Use ESLint and Prettier for code formatting
- Follow the existing code style in the project
- Write meaningful variable and function names
- Add comments for complex logic

### Testing

- Write unit tests for all new features
- Maintain or improve test coverage
- Use React Native Testing Library for component tests
- Write integration tests for critical user flows

## Pull Request Process

1. **Create a Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the coding standards
   - Write tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**

   ```bash
   npm test
   npm run lint
   ```

4. **Commit Your Changes**

   ```bash
   git add .
   git commit -s -m "feat(scope): description of your changes"
   ```

5. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use the pull request template
   - Provide a clear description of changes
   - Reference any related issues
   - Ensure all checks pass

## Pull Request Guidelines

- **Title**: Use conventional commit format
- **Description**: Clearly explain what changes were made and why
- **Testing**: Describe how the changes were tested
- **Screenshots**: Include screenshots for UI changes
- **Breaking Changes**: Clearly document any breaking changes

## Issue Reporting

When reporting issues, please include:

- **Environment**: iOS version, device type, app version
- **Steps to Reproduce**: Clear steps to reproduce the issue
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Screenshots**: If applicable, add screenshots

## Feature Requests

When requesting features:

- **Use Case**: Explain the problem you're trying to solve
- **Proposed Solution**: Describe your proposed solution
- **Alternatives**: Consider alternative solutions
- **Additional Context**: Add any other context about the feature

## Development Guidelines

### Firebase Integration

- Follow Firebase best practices
- Implement proper error handling
- Use Firestore security rules appropriately
- Handle offline scenarios gracefully

### Performance

- Optimize list rendering with FlatList
- Implement proper loading states
- Use React.memo for expensive components
- Minimize re-renders with proper dependency arrays

### Security

- Never commit sensitive information
- Use environment variables for configuration
- Validate all user inputs
- Follow Firebase security guidelines

### Accessibility

- Add proper accessibility labels
- Ensure proper color contrast
- Support screen readers
- Test with accessibility tools

## Questions?

If you have questions about contributing, please:

1. Check the existing documentation
2. Search existing issues and discussions
3. Create a new issue with the "question" label
4. Reach out to the maintainers

Thank you for contributing to the Marketing Checklist App!
