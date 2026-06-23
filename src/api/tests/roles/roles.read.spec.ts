import { test, expect } from "@playwright/test";
import { rolesClient } from "../../clients/rolesClient";
import { getAuthApiContext } from "../../utils/apiContext";
import { randomString } from "../../../shared/utils/random";
import { validateSchema } from "../../utils/helper";
import getAllrolesSchema from "../../schemas/roles/getAllRoles.schema.json";
import getRoleByIdSchema from "../../schemas/roles/getRoleById.schema.json";


test("GET all roles @api @roles", async () => {
    const apiContext = await getAuthApiContext();
    const roles = new rolesClient(apiContext);

    const response = await roles.getAllRoles();
    expect(response.status()).toBe(200);

    const body = await response.json();

    validateSchema(getAllrolesSchema, body);

    expect(body.statusCode).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
});


test("GET role by id - happy path @api @roles", async () => {

    const apiContext = await getAuthApiContext();
    const roles = new rolesClient(apiContext);
    const roleName = "Test role name " + randomString();
    const roleLabel = "Test role label" + randomString();
    const roleDesc = "Test role description " + randomString();

    const response = await roles.createRole({
        label: roleLabel,
        name: roleName,
        description: roleDesc
    });

    const createBody = await response.json();

    const roleId = createBody.data.id;
    const createdAt = createBody.data.createdAt;

    const res = await roles.getRoleById(roleId);
    const body = await res.json();

    validateSchema(getRoleByIdSchema, body);

    expect(body.statusCode).toBe(200);
    expect(body.message[0]).toBe("Get data successfully");
    expect(body.data.id).toBe(roleId);
    expect(body.data.name).toBe(roleName);
    expect(body.data.label).toBe(roleLabel);
    expect(body.data.description).toBe(roleDesc);

});