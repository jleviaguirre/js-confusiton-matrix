# Confusion Matrix Mod
A confusion matrix is a square matrix visualization which allows us to judge the performance of a classification model in supervised tasks where the ground truth label is known.

For example, if we train a model to classify 100 image instances into 10 classes, we can construct a confusion matrix to see how well our model is performing. The confusion matrix would be a 10x10 matrix where the cell in the j'th column and i'th row shows the relative number of times the classifier predicted an instance of class j as label i. "Relative" is used here because it is common to normalize the confusion matrix.

All source code for the mod example can be found in the `src` folder.

## Prerequisites
These instructions assume that you have [Node.js](https://nodejs.org/en/) (which includes npm) installed.

## How to get started (with development server)
- Open a terminal at the location of this example.
- Run `npm install`. This will install necessary tools. Run this command only the first time you are building the mod and skip this step for any subsequent builds.
- Run `npm run server`. This will start a development server.
- Start editing, for example `src/main.js`.
- In Spotfire, follow the steps of creating a new mod and connecting to the development server.

## Working without a development server
- In Spotfire, follow the steps of creating a new mod and then browse for, and point to, the _manifest_ in the `src` folder.