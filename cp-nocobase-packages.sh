#!/bin/bash

nocobase_dir=$1

packages=(
    "utils"
    "server"
    "database"
    "resourcer"
    "actions"
    "acl"
)

rm -rf node_modules/@nocobase

mkdir node_modules/@nocobase

for package in ${packages[@]}; do
    cp -r $nocobase_dir/packages/core/$package node_modules/@nocobase
done

packages=(
    "acl"
    "users"
    "error-handler"
    "collection-manager"
    "ui-schema-storage"
    "ui-routes-storage"
    "file-manager"
    "system-settings"
    "china-region"
    "workflow"
    "client"
)

for package in ${packages[@]}; do
    cp -r $nocobase_dir/packages/plugins/$package node_modules/@nocobase/plugin-$package/
done
