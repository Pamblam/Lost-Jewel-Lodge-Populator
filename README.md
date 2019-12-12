# Lost Jewel Lodge Populator

A bunch of Node scripts for scraping Grand Lodge directories and then posting wiki articles on [The Lost Jewel](https://thelostjewel.org). This software comes with an [MIT License](LICENSE). It's mainly being posted here in the spirit of disclosure, but I do ask that if you use it, that you create a pull request and update the repo with your changes and additions.

## Usage

Use with caution. If you're not familiar with the relevant technologies, please avoid using this as it could potentially make a mess on the Wiki.

 - Clone the repo, do `npm install`.
 - Put your wiki login in the `.env` file.
 - Copy one of the state directories and re-name it to whatever state you're working on.
 - Inspect the relevant lodge directory and adjust the `scrape.js` file as needed.
 - Adjust the `post.js` file, if neccesary.
 - `cd` into the relevant directory and run `node scrape`
 - When it's done, run `node post` 
