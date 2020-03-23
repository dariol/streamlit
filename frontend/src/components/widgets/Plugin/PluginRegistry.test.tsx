/**
 * @license
 * Copyright 2018-2020 Streamlit Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import { SessionInfo } from "lib/SessionInfo"
import { buildHttpUri } from "lib/UriUtil"
import { PluginRegistry } from "./PluginRegistry"

const MOCK_SERVER_URI = {
  host: "streamlit.mock",
  port: 80,
  basePath: "",
}

const MOCK_PLUGIN_ENDPOINT = new RegExp(
  buildHttpUri(MOCK_SERVER_URI, "/plugin/*")
)

describe("PluginRegistry", () => {
  let axiosMock: MockAdapter

  beforeEach(() => {
    axiosMock = new MockAdapter(axios)
    SessionInfo.current = new SessionInfo({
      sessionId: "sessionId",
      streamlitVersion: "sv",
      pythonVersion: "pv",
      installationId: "iid",
      authorEmail: "ae",
      maxCachedMessageAge: 2,
      commandLine: "command line",
      userMapboxToken: "mockUserMapboxToken",
    })
  })

  afterEach(() => {
    axiosMock.restore()
    SessionInfo["singleton"] = undefined
  })

  test("retrieves data from server", async () => {
    const javascript = "some javascript!"

    axiosMock.onGet(MOCK_PLUGIN_ENDPOINT).replyOnce(200, javascript)

    const registry = new PluginRegistry(() => MOCK_SERVER_URI)
    await expect(registry.getPlugin("123")).resolves.toEqual(javascript)
    expect(axiosMock.history.get.length).toBe(1)

    // Call the function a second time. It should resolve, but we shouldn't
    // have any more calls to the server.
    await expect(registry.getPlugin("123")).resolves.toEqual(javascript)
    expect(axiosMock.history.get.length).toBe(1)
  })

  test("throws an error on missing data", async () => {
    axiosMock.onGet(MOCK_PLUGIN_ENDPOINT).replyOnce(404)

    const registry = new PluginRegistry(() => MOCK_SERVER_URI)
    await expect(registry.getPlugin("123")).rejects.toEqual(
      new Error("Request failed with status code 404")
    )
  })
})
