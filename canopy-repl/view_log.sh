cat chrome_debug.log | grep CONSOLE | while read -r line; do echo "$line" | cut -d' ' -f2-; done
