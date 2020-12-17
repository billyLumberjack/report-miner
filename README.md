# Virtual Machines 
## Connection
Una VM linux provvede a fare lo scraping (sometimes anche il retrival dei dati necessari).
Per avviare una sessione SSH verso la macchina eseguire:
```sh
ssh -i "june-key-pair.pem" ubuntu@ec2-18-196-237-113.eu-central-1.compute.amazonaws.com
```
notare, il .pem deve essere settato a 
```sh
chmod 400 june-key-pair.pem
```
## Startup and Shutdown
Ci sono due lambda functions che a pochi minuti di distanza, rispettivaente, triggerano lo startup e lo shutonw della macchina.
Lo scheduler di queste non mi è ben chiaro ma penso sia settato direttamente nel file _serverless.yml_
## Batch startup
Appena dopo lo startup della macchina le istruzioni bash contenute in _rc.local_ vengono eseguite.
Di seguito un esempio
```sh
cat /etc/rc.local
#!/bin/sh -e
#
# rc.local
#
# This script is executed at the end of each multiuser runlevel.
# Make sure that the script will "exit 0" on success or any other
# value on error.
#
# In order to enable or disable this script just change the execution
# bits.
#
# By default this script does nothing.

cd ../home/ubuntu/report-miner/

npm run-script crawl
npm run-script parse

exit 0
``` 
# report-miner
