import { Router } from 'express';

import { controller as mySuggestionC } from './my-suggestion.controller';
import { controller as recipeInfoC } from './recipe-info.controller';
import { controller as shoppingListC } from './shopping-list.controller';
import { controller as directionsC } from './directions.controller';
import { controller as dbTestsC } from './db-tests.controller';

const expressRouter = Router();

export const router = (_) => {
  return expressRouter;
}