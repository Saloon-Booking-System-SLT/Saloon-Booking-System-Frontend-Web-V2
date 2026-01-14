// Mock axios and its ESM import before importing App
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn()
    }))
  }
}));

// Mock axios instance from our Api/axios
jest.mock('./Api/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders App component without crashing', () => {
  render(<App />);
  // Simply verify that the component renders without error
  const appContainer = document.querySelector('div');
  expect(appContainer).toBeTruthy();
});
