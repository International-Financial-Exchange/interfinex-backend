FROM mongo

WORKDIR ./mongo

COPY ./mongod.conf ./config/mongod.conf
COPY ./rsInitiate.js ./scripts/rsInitiate.js

RUN mkdir -p -m 777 /interfinex_data/mongodb/data/
RUN mkdir -p -m 777 /interfinex_data/mongodb/log/

CMD [ "--config", "./config/mongod.conf" ]

EXPOSE 27017