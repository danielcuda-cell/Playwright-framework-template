import { test, expect } from "@playwright/test";
import { rolesClient } from "../../clients/rolesClient";
import { getAuthApiContext, getNoAuthApiContext } from "../../utils/apiContext";
import { randomString } from "../../../shared/utils/random";
import { validateSchema } from "../../utils/helper";
import createRoleSchema from "../../schemas/roles/createRole.schema.json";


test("CREATE role - happy path@api @roles", async () => {
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

    const body = await response.json();
    // Data validation
    expect(body.statusCode).toBe(201);
    expect(body.message[0]).toBe("Created successfully");
    expect(body.data.label).toEqual(roleLabel);
    expect(body.data.name).toEqual(roleName);
    expect(body.data.description).toEqual(roleDesc);

    // Schema validation
    validateSchema(createRoleSchema, body);
});


test("CREATE role with name already in use @api @roles", async () => {
    const apiContext = await getAuthApiContext();
    const roles = new rolesClient(apiContext);
    const roleName = "Test role name " + randomString();
    const roleLabel = "Test role label" + randomString();
    const roleDesc = "Test role description " + randomString();
    const roleLabel2 = "Test role label" + randomString();
    const roleDesc2 = "Test role description " + randomString();

    const response = await roles.createRole({
        label: roleLabel,
        name: roleName,
        description: roleDesc
    });

    const body = await response.json();
    
    const roleId = body.data.id;

    const response2 = await roles.createRole({
        label: roleLabel2,
        name: roleName,
        description: roleDesc2
    });

    const body2 = await response2.json();

    expect(body2.statusCode).toBe(409);
    expect(body2.message[0]).toBe(`A role with name \"${roleName}\" already exists`);
    expect(body2.error).toBe("Internal Error");

});


test("CREATE role with label already in use @api @roles", async () => {
    const apiContext = await getAuthApiContext();
    const roles = new rolesClient(apiContext);
    const roleName = "Test role name " + randomString();
    const roleLabel = "Test role label" + randomString();
    const roleDesc = "Test role description " + randomString();
    const roleName2 = "Test role name" + randomString();
    const roleDesc2 = "Test role description " + randomString();

    const response = await roles.createRole({
        label: roleLabel,
        name: roleName,
        description: roleDesc
    });

    const body = await response.json();
    
    const roleId = body.data.id;

    const response2 = await roles.createRole({
        label: roleLabel,
        name: roleName2,
        description: roleDesc2
    });

    const body2 = await response2.json();

    expect(body2.statusCode).toBe(409);
    expect(body2.message[0]).toBe(`A role with name \"${roleLabel}\" already exists`);
    expect(body2.error).toBe("Internal Error");

});


test("CREATE role without auth token @api @roles", async () => {
    const apiContext = await getNoAuthApiContext();
    const roles = new rolesClient(apiContext);
    const roleName = "Test role name " + randomString();
    const roleLabel = "Test role label" + randomString();
    const roleDesc = "Test role description " + randomString();

    const response = await roles.createRole({
        label: roleLabel,
        name: roleName,
        description: roleDesc,
    });

    const body = await response.json();
    // Data validation
    expect(body.statusCode).toBe(401);
    expect(body.message).toBe("Token not found");
    expect(body.error).toBe("Unauthorized");
});