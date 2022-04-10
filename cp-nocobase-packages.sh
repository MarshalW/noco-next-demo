#!/bin/bash

nocobase_dir=$1

packages=(
    "utils"
    "server"
    "database"
    "resourcer"
    "actions"
    "acl"
    "plugin-acl"
    "plugin-users"
    "plugin-error-handler"
)

rm -rf node_modules/@nocobase

mkdir node_modules/@nocobase

for package in ${packages[@]}; do
    cp -r $nocobase_dir/packages/$package node_modules/@nocobase
done
