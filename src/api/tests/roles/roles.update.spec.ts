import { test, expect } from "@playwright/test";
import { rolesClient } from "../../clients/rolesClient";
import { getAuthApiContext } from "../../utils/apiContext";
import { randomString } from "../../../shared/utils/random";
import { validateSchema } from "../../utils/helper";
import updateRoleSchema from "../../schemas/roles/updateRole.schema.json";


test("UPDATE role - happy path @api @roles", async () => {
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

    const bodyResponseRole1 = await response.json();

    const roleId = bodyResponseRole1.data.id;
    const createdAt = bodyResponseRole1.data.createdAt;

    const newName = "Updated role " + randomString();
    const newLabel = "Updated role " + randomString();
    const newDesc = "Updated role " + randomString();

    const updateRes = await roles.updateRole(roleId, {
        label: newLabel,
        name: newName,
        description: newDesc
    });

    expect(updateRes.status()).toBe(200);

    const body = await updateRes.json();

    validateSchema(updateRoleSchema, body);

    expect(body.data.id).toBe(roleId);
    expect(body.data.name).toBe(newName);
    expect(body.data.label).toBe(newLabel);
    expect(body.data.description).toBe(newDesc);
    expect(body.data.createdAt).toBe(createdAt);
    expect(body.data.updatedAt).not.toBe(createdAt);
});


test("UPDATE role - invalid role id @api @roles", async () => {
    const apiContext = await getAuthApiContext();
    const roles = new rolesClient(apiContext);
    const roleName = "Test role " + randomString();
    const roleId = randomString();


    const updateRes = await roles.updateRole(roleId, {
        name: roleName,  
    });

    expect(updateRes.status()).toBe(200);

    const body = await updateRes.json();

    expect(body.statusCode).toBe(404);
    expect(body.message[0]).toBe("Role not found");
    expect(body.error).toBe("Internal Error");
});


test("UPDATE role - role name already in use @api @roles", async () => {
    const apiContext = await getAuthApiContext();
    const roles = new rolesClient(apiContext);
    const roleName1 = "Test role name " + randomString();
    const roleLabel1 = "Test role label" + randomString();
    const roleDesc1 = "Test role description " + randomString();
    const roleName2 = "Test role name " + randomString();
    const roleLabel2 = "Test role label" + randomString();
    const roleDesc2 = "Test role description " + randomString();

    const response = await roles.createRole({
        label: roleLabel1,
        name: roleName1,
        description: roleDesc1,
    });

    const bodyResponseRole1 = await response.json();
    const role1Id = bodyResponseRole1.data.id;

    await roles.createRole({
        label: roleLabel2,
        name: roleName2,
        description: roleDesc2,
    });

    const updateRes = await roles.updateRole(role1Id, {
        name: roleName2,
    });

    expect(updateRes.status()).toBe(200);

    const body = await updateRes.json();

    expect(body.statusCode).toBe(409);

});


test("UPDATE role - role label already in use @api @roles", async () => {
    const apiContext = await getAuthApiContext();
    const roles = new rolesClient(apiContext);
    const roleName1 = "Test role name " + randomString();
    const roleLabel1 = "Test role label" + randomString();
    const roleDesc1 = "Test role description " + randomString();
    const roleName2 = "Test role name " + randomString();
    const roleLabel2 = "Test role label" + randomString();
    const roleDesc2 = "Test role description " + randomString();

    const response = await roles.createRole({
        label: roleLabel1,
        name: roleName1,
        description: roleDesc1,
    });

    const bodyResponseRole1 = await response.json();
    const role1Id = bodyResponseRole1.data.id;

    await roles.createRole({
        label: roleLabel2,
        name: roleName2,
        description: roleDesc2,
    });

    const updateRes = await roles.updateRole(role1Id, {
        label: roleLabel2,
    });

    expect(updateRes.status()).toBe(200);

    const body = await updateRes.json();

    expect(body.statusCode).toBe(409);

});