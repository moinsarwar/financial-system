#!/bin/bash
ssh -o BatchMode=yes -o ConnectTimeout=5 root@163.245.222.160 'docker exec fincompare-db-1 pg_dump -U system -d fincompare -t products --data-only --inserts' > remote_products.sql
sed -i 's/INSERT INTO public.products/INSERT INTO public.front_products/g' remote_products.sql
echo "DELETE FROM front_products;" | docker exec -i finos-db-1 psql -U finos -d finos
cat remote_products.sql | docker exec -i finos-db-1 psql -U finos -d finos
