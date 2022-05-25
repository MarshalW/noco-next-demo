#!/bin/bash
###
# @Author: pangff
# @Date: 2022-04-13 15:42:47
 # @LastEditTime: 2022-05-18 09:46:27
 # @LastEditors: pangff
# @Description: 复制脚本
 # @FilePath: /noco-next-demo/cp-nocobase-packages.sh
# stay hungry,stay foolish
###

nocobase_dir=$1

packages=(
    "utils"
    "server"
    "database"
    "resourcer"
    "actions"
    "test"
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
    "notifications"
)

for package in ${packages[@]}; do
    cp -r $nocobase_dir/packages/plugins/$package node_modules/@nocobase/plugin-$package/
done
