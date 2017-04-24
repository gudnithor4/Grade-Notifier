#!/bin/bash

IP=$(curl localhost:8081/scrape)

echo "$IP"