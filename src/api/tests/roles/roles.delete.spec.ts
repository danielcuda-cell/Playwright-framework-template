import { test, expect } from "@playwright/test";
import { rolesClient } from "../../clients/rolesClient";
import { getAuthApiContext, getNoAuthApiContext } from "../../utils/apiContext";
import { randomString } from "../../../shared/utils/random";


test("DELETE role - happy path @api @roles", async () => {
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

    const roleId = body.data.id;

    const deleteRes = await roles.deleteRole(roleId);

    const getRes = await roles.getRoleById(roleId);
    const getResBody = await getRes.json();

    expect(getResBody.statusCode).toBe(404);
    expect(getResBody.message[0]).toBe("Role not found");

});


test("DELETE role - Invalid role id @api @roles", async () => {
    const apiContext = await getAuthApiContext();
    const roles = new rolesClient(apiContext);
    const roleId = randomString();

    const deleteRes = await roles.deleteRole(roleId);
    const deleteResBody = await deleteRes.json();

    expect(deleteResBody.statusCode).toBe(404);

    // expect(deleteRes.status()).toBe(404);

});