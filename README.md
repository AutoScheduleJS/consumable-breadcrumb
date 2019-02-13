# Plot
DB of all grocery products associated with supermarket & price.
Could use products info from OpenFoodFacts. We want it to be focused on local options, taking into account small market, itinerant market, etc...

# SaaS Application
Game: race number of scanned missing articles in a store.
Easily scan articles in a store -> app know in which store you are, you just have to scan and type the price.

scan a receipt to enrich the DB.

Give a shopping list and a position, get a list of roadmap (like GMap results for route), with associated prices (and time needed)

# Architecture
DB with: stores with products availability, local store with products availability & prices, products.
MongoDB: stores with mean of its local stores about products info.
local store which overwrite its store info.
Neo4J: Products with category as node.
for discount code, maybe use a new field with { function: fnName, productId: }

OR:
Neo4J: Products with category and link to main stores. Pros: with product linked to store, we should filter products by selecting store first. MongoDB for local store. For all independant markets, regroup them (per region)

main workflow: user has a list of starred local stores + list of products (family/generic with quality or real product).
With Neo4J, we retrieve real product (behind generic one - resulting in potentially a lot of products)
We check store that have the products. If there is no information, we check the associated main store.

How to handle generic name ? "strawberry jam" = generic ; "jam" = category -> no distinction necessary between both. Manual organisation
Food -> Spreadable -> Sweet spreadable -> Jam -> Strawberry jam. These category have to be usefull for recipes. A recipe can target a category. too broad "Spreads" or "Food" nor "Jam" aren't usefull
Broad categories could be usefull to group items when creating a shopping list, but not too broad, as in a shop, all "beverage" products aren't necessarly next together. But "alcool products" and "fruits juice" are good example of categories
From OFF base, retrieve white listed categories and create relationship between product and category -> too much complexity:
hierarchy isn't clearly established, it can vary between stores. When a product is in two categories (frozen-food + meet) where do you put it ? let user choose. If a product belongs to "breakfast" and "jam" and "fruit-jam", there is clear hierarcy between jam and fruit-jam but not jam and breakfast.
let user combine categories so we can compute a score of relevance.
```shell
db.products.aggregate([
  { $match: { categories_tags: { $exists: true, $ne: [] }}},
  { $project: { categories_tags: 1 }},
  { $unwind: "$categories_tags" },
  { $group: {_id: "$categories_tags", total: { $sum: 1 }}},
  { $sort: { total: -1 }}
])
db.products.aggregate([{ $match: { categories_tags: { $exists: true, $ne: [] }}}, { $project: { categories_tags: 1 }}, { $unwind: "$categories_tags" }, { $group: {_id: "$categories_tags", total: { $sum: 1 }}}, { $sort: { total: -1 }}])
db.products.aggregate([
  { $match: { brands: { $exists: true, $ne: "" }}},
  { $project: { brands: 1 }},
  { $group: { _id: "$brands", total: { $sum: 1 }}},
  { $sort: { total: -1 }}
])
```

Greatest brands for chocolates:
```cypher
MATCH (p:Product)-[:BELONGS]->(:Category {name: "chocolates"})
MATCH (s:Brand)<-[:MARKED_BY]-(p)
WITH p, s, size((s)<-[:MARKED_BY]-(:Product)-[:BELONGS]->(:Category {name: "chocolates"})) as brandSize
ORDER BY brandSize DESC
RETURN p, s
```


preservation (freeze, can, fresh): product property (optional - only for fruts, veg, and some other) -> from OFF DB: surgeles
chocolate: product property: % of cacao
alcool: product property: % of alcool
milk: powder, UHT, Pasterised
bio: array of labels
serving size
nutriments: nutriment per serving size
brand -> associate quality with brand. Brands are quite similar across country, no needs to differentiate them per country.
  how to handle multiple brands ? link a product to all brands. How to filter ?
  job to keep only relationship with most impact (discount/Premium Plus)

# Other project
- basket: app that give you the market where you will pay the least, worldwide, community driven
- http://www.mesprovisions.com
- http://anti-crise.fr
- http://prixing.fr/

- https://market.mashape.com/Datagram/products : API localisé avec prix