@echo off
title 印刷登记系统本地服务器
echo Start the server, please wait.
cd /d %~dp0
start http://localhost:3000/index.html
pnpm server.js
pause