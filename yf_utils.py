#!/usr/bin/env python3
"""
Utilitário compartilhado pelos scrapers: yfinance não expõe timeout
configurável nas chamadas .info/.history, e ocasionalmente uma
requisição HTTP interna fica pendurada indefinidamente sem lançar
exceção nem respeitar timeout. Isso trava o processo inteiro.
signal.alarm força a interrupção depois de N segundos.
"""
import signal

class YFTimeout(Exception):
    pass

def _timeout_handler(signum, frame):
    raise YFTimeout()

def yf_com_timeout(func, segundos=20):
    signal.signal(signal.SIGALRM, _timeout_handler)
    signal.alarm(segundos)
    try:
        return func()
    finally:
        signal.alarm(0)
