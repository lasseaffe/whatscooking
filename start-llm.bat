@echo off
:: start-llm.bat — launch llama-server with a configurable context size
::
:: Usage:
::   start-llm.bat            (uses default 512)
::   start-llm.bat 2048       (custom ctx size)
::
:: The Next.js app will auto-restart with a larger ctx if it detects overflow,
:: but you can also run this manually with a larger value.

set CTX=%1
if "%CTX%"=="" set CTX=512

echo [llama.cpp] Starting with --ctx-size %CTX%
"C:\Users\lasse\Downloads\llama-b9090-bin-win-cpu-x64\llama-server.exe" ^
  -m "C:\Users\lasse\.cache\huggingface\hub\models--hugging-quants--Llama-3.2-3B-Instruct-Q4_K_M-GGUF\snapshots\eb72f2a08dd2b9edd07ffacfe5aa56938b7939b0\llama-3.2-3b-instruct-q4_k_m.gguf" ^
  --host 0.0.0.0 --port 8080 --ctx-size %CTX% --threads 6 -n -1
