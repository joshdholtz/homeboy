# Homebody

Dashboard for [Wireless Sensor Tags](http://wirelesstag.net/) using [IFFFT]() and [IronCache](iron.io)

## How

1. **Wireless Sensor Tag** events sent to **IFFFT**
2. **IFFFT** sends API request to **IronCache (memcache)**
3. **Website** polls **IronCache**
