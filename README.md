# Kafkajs, rxjs poc

![Result](https://p94.f3.n0.cdn.getcloudapp.com/items/Jruqe9Nx/a31d8fc8-a291-4d7f-8b1d-3084e5c99b74.gif?source=viewer&v=699ef448757f836dc803d04527b56afd)

## Useful commands
### Run
```bash
$ docker-compose -d # (--detach)
$ docker-compose exec broker bash # Execute command on running container "broker", use "bash"
$ kafka-* [tab] # (Inside broker container), access all kafka clis 
```

## Create a topic
```bash
$ kafka-topics --bootstrap-server broker:9092 --topic myTopic --create --replication-factor 1 --partitions 2 
$ kafka-topics --bootstrap-server broker:9092 --topic myTopic --describe
```

## Console consumer
```bash
$ kafka-console-consumer --topic example-topic --bootstrap-server broker:9092 --from-beginning --property print.key=true --property key.separator="-"
```

### Docs

- [Console Producer and Consumer Basics, no (de)serializers](https://kafka-tutorials.confluent.io/kafka-console-consumer-producer-basics/kafka.html)
