product {
  _id,
  name: product code that help identification,
  code: to retrieve the product from scanning,
  packaging?: [freeze, can, fresh],
  cacaoPercent?,
  alcoolPercent?,
}
category {
  _id,
  name,
  count : number of products attached to it. Define hierarchy
}
brand {
  _id,
  name: brand name,
  quality: discout, premimum...
}
store {
  _id,
  name,
  country (for international store, one document per country. + allow to know the currency)
  availableProducts: [
    { id: product id, price: mean of all local store }
  ],
  unavailableProducts: [
    id
  ]
}
localStore {
  _id,
  name: local store name,
  location: {
    gps: {
      long,
      lat
    },
    openStreetMap: url ?
    gmap: code ?,
    postalAddress
  }
  storeRef: reference to the store representative of all the local stores,
  availableProducts: [
    { id: product id, price }
  ],
  unavailableProducts: [
    id
  ]
}