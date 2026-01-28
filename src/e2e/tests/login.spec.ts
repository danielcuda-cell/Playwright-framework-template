import { test, expect } from '../fixtures/test-fixtures';
import { LoginMessages } from '../../shared/messages';

const loginMessages = new LoginMessages();

test('Wrong Login', async ({ loginPage }) => { // Here we ask to "fixtures" for an instance of LoginPage

  await loginPage.goto(); // Navigating to the login page

  await loginPage.login('wrongUser', 'wrongPassword'); // Attempting to login with incorrect credentials

  await loginPage.assertLoginError(loginMessages.INVALID_CREDENTIALS); // Asserting that the correct error message is displayed
});