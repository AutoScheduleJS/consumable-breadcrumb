## What is needed?

Having a product mean price per store (per country) ?
If user have their starred place, what will be the value of this information?
It could be a job running to compute this every month -> for each store, find all local store with product info (price, id), then for each relation between store & product, update it by computing mean price -> scoreboard + history chart for each products and aggregation of products from category. (History could be in MongoDB Collections -> relationShip ID -> array of timestamped mean price)

How to handle unavailability? Currently, relationship between store & product -> available
- special event
- season (for raw food)
as property of available relationship - period/phase (array of interval ?) - is it possible to use it with cypher?
  - x | IN ["NOV", "JAN"] -> not very accurate (month based availability), but could have multiple periods in the year
  - v | day of year + inclusive/exclusive (november -> january : saved as january ; november ; exclusive) ; (april -> august : saved as same ; inclusive), but only one period in the year.
Could be a daily job to update available property based on current date and period.
For special case where products have multiple availability period, instead just switch a property from SELL "available": true/false
link "DONT_SELL" to confirm unavailability.
both SELL and DONT_SELL have a last_checked property to have a confidence index.

How to handle global store update ?
 - Global store have every products from local store
 - Global store have products from at least 90% of local store
   To avoid filling the database with redundant information, between global & local: keep 90% of what is common for all local on global store : this avoid duplicate this information between all locals (available_products). But do not put all available products in global store: prevent an original local product to be duplicate in "unavailable_products" in all others stores.
   Use a median price info in global store, so there is no need to duplicate data in local store. Fields available/unavailable are only used when local data are variant.
 - job who aggregate values from local stores or at each local update ? Jobs need less wire and are easier to prepare.

Local store are the source of thruth: information like availability go from them to global store.
Global store information are usefull for newly created store, to have an idea of what it has

How to handle raw product (code) ?
 - Product without code -> check OOF base what are products without code.
 - property like variety/type