DHOST=$(word 2, $(MAKECMDGOALS) )
DCTX=$(word 3, $(MAKECMDGOALS) )
webinst:
	php ./dynacase-devtool.phar generateWebinst -s .

po:
	php ./dynacase-devtool.phar extractPo -s .

deploy:
	php ./dynacase-devtool.phar deploy -u http://admin:anakeen@$(DHOST)/control/ -c $(DCTX) -a -s .
