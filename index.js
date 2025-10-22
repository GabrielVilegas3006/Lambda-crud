const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Productos";

exports.handler = async (event) => {
    let body;

    if (event.body) {
        try {
            body = JSON.parse(event.body);
        } catch {
            body = event;
        }
    } else {
        body = event;
    }

    const action = body.action;
    const key = body.key;
    const item = body.item;

    try {
        let result;

        switch(action) {
            case "create":
                if (!item || !item.id) throw new Error("Item o id faltante");
                await dynamo.put({ TableName: TABLE_NAME, Item: item }).promise();
                result = { message: "Item creado", item };
                break;

            case "read":
                if (!key || !key.id) throw new Error("Key faltante");
                const getRes = await dynamo.get({ TableName: TABLE_NAME, Key: key }).promise();
                result = getRes.Item || { message: "Item no encontrado" };
                break;

            case "update":
                if (!key || !key.id || !item) throw new Error("Key o item faltante");
                const updateParams = {
                    TableName: TABLE_NAME,
                    Key: key,
                    UpdateExpression: "set #Nombre = :Nombre, #Precio = :Precio, #Stock = :Stock",
                    ExpressionAttributeNames: {
                        "#Nombre": "Nombre",
                        "#Precio": "Precio",
                        "#Stock": "Stock"
                    },
                    ExpressionAttributeValues: {
                        ":Nombre": item.Nombre,
                        ":Precio": item.Precio,
                        ":Stock": item.Stock
                    },
                    ReturnValues: "ALL_NEW"
                };
                const updateRes = await dynamo.update(updateParams).promise();
                result = { message: "Item actualizado", item: updateRes.Attributes };
                break;

            case "delete":
                if (!key || !key.id) throw new Error("Key faltante");
                await dynamo.delete({ TableName: TABLE_NAME, Key: key }).promise();
                result = { message: "Item eliminado" };
                break;

            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Acción no válida. Usa create/read/update/delete" })
                };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};